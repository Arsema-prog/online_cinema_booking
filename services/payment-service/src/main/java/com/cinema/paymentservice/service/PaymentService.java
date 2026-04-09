package com.cinema.paymentservice.service;

import com.cinema.paymentservice.dto.CreateCheckoutSessionRequest;
import com.cinema.paymentservice.dto.CheckoutSessionResponse;
import com.cinema.paymentservice.model.Payment;
import com.cinema.paymentservice.repository.PaymentRepository;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;
import com.stripe.net.RequestOptions;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.client.RestTemplate;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class PaymentService {

    private static final Logger log = LoggerFactory.getLogger(PaymentService.class);

    private final PaymentRepository paymentRepository;
    private final RestTemplate restTemplate;

    @Value("${stripe.api-key}")
    private String stripeApiKey;

    @Value("${booking.service.url:http://booking-service}")
    private String bookingServiceUrl;

    public PaymentService(PaymentRepository paymentRepository, RestTemplate restTemplate) {
        this.paymentRepository = paymentRepository;
        this.restTemplate = restTemplate;
    }

    @PostConstruct
    public void init() {
        Stripe.apiKey = stripeApiKey;
    }

    public CheckoutSessionResponse createCheckoutSession(
            CreateCheckoutSessionRequest request,
            String callerUserId,
            boolean privilegedCaller
    ) throws StripeException {
        log.info("Creating checkout session for booking: {}", request.getBookingId());

        BookingCheckoutResponse bookingSnapshot = getBookingSnapshot(request.getBookingId());
        validateBookingOwnership(bookingSnapshot, request.getBookingId(), callerUserId, privilegedCaller);
        validateBookingState(bookingSnapshot, request.getBookingId());

        Long clientAmount = request.getAmount() != null ? request.getAmount() : 0L;
        Long amountInCents = resolveAmountFromBooking(clientAmount, bookingSnapshot);
        if (amountInCents == null || amountInCents <= 0) {
            throw new IllegalArgumentException("Amount must be greater than zero");
        }
        String normalizedCurrency = request.getCurrency() != null
                ? request.getCurrency().toUpperCase()
                : "USD";

        Optional<Payment> existingPending = paymentRepository
                .findTopByBookingIdAndStatusOrderByCreatedAtDesc(request.getBookingId(), Payment.PaymentStatus.PENDING);
        if (existingPending.isPresent() && existingPending.get().getStripeSessionId() != null) {
            notifyBookingPaymentInitiated(request.getBookingId());
            return reopenExistingCheckoutSession(existingPending.get(), request.getBookingId());
        }

        // For development with mock key, return mock response
        if (stripeApiKey.equals("sk_test_mock")) {
            log.info("Using mock checkout session response");
            String sessionId = "mock_session_" + request.getBookingId();
            String mockUrl = buildMockCheckoutUrl(request.getBookingId(), sessionId);
            Payment mockPayment = paymentRepository.findByStripeSessionId(sessionId)
                    .orElseGet(() -> buildPendingPayment(request.getBookingId(), sessionId, amountInCents, normalizedCurrency));
            mockPayment.setAmount(amountInCents);
            mockPayment.setCurrency(normalizedCurrency);
            mockPayment.setStatus(Payment.PaymentStatus.PENDING);
            paymentRepository.save(mockPayment);
            notifyBookingPaymentInitiated(request.getBookingId());
            return new CheckoutSessionResponse(sessionId, mockUrl);
        }

        // Real Stripe integration
        Map<String, Object> params = new HashMap<>();
        params.put("success_url", request.getSuccessUrl());
        params.put("cancel_url", request.getCancelUrl());
        params.put("mode", "payment");

        Map<String, Object> lineItem = new HashMap<>();
        lineItem.put("price_data", Map.of(
                "currency", normalizedCurrency,
                "unit_amount", amountInCents,
                "product_data", Map.of(
                        "name", "Cinema Booking - " + request.getBookingId(),
                        "description", "Movie tickets and snacks"
                )
        ));
        lineItem.put("quantity", 1);
        params.put("line_items", java.util.List.of(lineItem));

        // Add metadata for webhook
        Map<String, String> metadata = new HashMap<>();
        metadata.put("bookingId", request.getBookingId().toString());
        params.put("metadata", metadata);

        RequestOptions requestOptions = RequestOptions.builder()
                .setIdempotencyKey("checkout-session:" + request.getBookingId())
                .build();

        Session session = Session.create(params, requestOptions);

        Payment payment = paymentRepository.findByStripeSessionId(session.getId())
                .orElseGet(() -> buildPendingPayment(request.getBookingId(), session.getId(), amountInCents, normalizedCurrency));
        payment.setAmount(amountInCents);
        payment.setCurrency(normalizedCurrency);
        payment.setStatus(Payment.PaymentStatus.PENDING);
        paymentRepository.save(payment);
        notifyBookingPaymentInitiated(request.getBookingId());

        return new CheckoutSessionResponse(session.getId(), session.getUrl());
    }

    private Payment buildPendingPayment(UUID bookingId, String sessionId, Long amount, String currency) {
        Payment payment = new Payment();
        payment.setBookingId(bookingId);
        payment.setStripeSessionId(sessionId);
        payment.setAmount(amount);
        payment.setCurrency(currency);
        payment.setStatus(Payment.PaymentStatus.PENDING);
        payment.setCreatedAt(Instant.now());
        return payment;
    }

    private Long resolveAmountFromBooking(Long requestedAmount, BookingCheckoutResponse bookingSnapshot) {
        if (bookingSnapshot == null || bookingSnapshot.getTotalAmount() == null) {
            return requestedAmount;
        }

        try {
            BigDecimal total = bookingSnapshot.getTotalAmount();
            Long cents = total.multiply(BigDecimal.valueOf(100)).setScale(0, RoundingMode.HALF_UP).longValue();
            log.info("Resolved amount {} cents from booking service for booking {}", cents, bookingSnapshot.getId());
            return cents;
        } catch (Exception e) {
            log.warn("Failed to resolve booking amount for {}. Falling back to client amount. Error: {}", bookingSnapshot.getId(), e.getMessage());
        }

        return requestedAmount;
    }

    private BookingCheckoutResponse getBookingSnapshot(UUID bookingId) {
        if (bookingId == null) {
            throw new IllegalArgumentException("Booking ID is required");
        }

        try {
            var response = restTemplate.getForEntity(
                    bookingServiceUrl + "/bookings/" + bookingId,
                    BookingCheckoutResponse.class
            );
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }
        } catch (Exception e) {
            log.warn("Failed to load booking {} from booking service: {}", bookingId, e.getMessage());
        }

        throw new IllegalStateException("Unable to load booking details for " + bookingId);
    }

    private void validateBookingState(BookingCheckoutResponse bookingSnapshot, UUID bookingId) {
        String status = bookingSnapshot.getStatus();
        if (status == null || status.isBlank()) {
            throw new IllegalStateException("Booking " + bookingId + " has no status");
        }

        if ("CONFIRMED".equals(status)) {
            throw new IllegalStateException("Booking " + bookingId + " is already confirmed");
        }
        if ("FAILED".equals(status) || "EXPIRED".equals(status) || "CANCELLED".equals(status)) {
            throw new IllegalStateException("Booking " + bookingId + " is not payable in state " + status);
        }
        if (!"SEATS_HELD".equals(status) && !"SNACKS_SELECTED".equals(status) && !"PAYMENT_PENDING".equals(status)) {
            throw new IllegalStateException("Booking " + bookingId + " is not ready for checkout in state " + status);
        }
    }

    private void validateBookingOwnership(
            BookingCheckoutResponse bookingSnapshot,
            UUID bookingId,
            String callerUserId,
            boolean privilegedCaller
    ) {
        if (privilegedCaller) {
            return;
        }

        if (callerUserId == null || callerUserId.isBlank()) {
            throw new IllegalStateException("Authenticated user identifier is missing");
        }

        if (bookingSnapshot.getUserId() == null) {
            throw new IllegalStateException("Booking " + bookingId + " has no owner");
        }

        if (!bookingSnapshot.getUserId().toString().equals(callerUserId)) {
            throw new IllegalStateException("User is not allowed to pay for booking " + bookingId);
        }
    }

    private CheckoutSessionResponse reopenExistingCheckoutSession(Payment payment, UUID bookingId) throws StripeException {
        if (stripeApiKey.equals("sk_test_mock")) {
            return new CheckoutSessionResponse(
                    payment.getStripeSessionId(),
                    buildMockCheckoutUrl(bookingId, payment.getStripeSessionId())
            );
        }

        Session session = Session.retrieve(payment.getStripeSessionId());
        return new CheckoutSessionResponse(session.getId(), session.getUrl());
    }

    private String buildMockCheckoutUrl(UUID bookingId, String sessionId) {
        return "http://localhost:5174/bookers/booking/success?bookingId=" + bookingId + "&session_id=" + sessionId;
    }

    private void notifyBookingPaymentInitiated(UUID bookingId) {
        if (bookingId == null) {
            return;
        }
        try {
            restTemplate.postForEntity(bookingServiceUrl + "/bookings/" + bookingId + "/initiate-payment", null, Void.class);
        } catch (Exception e) {
            log.warn("Failed to notify booking service about payment initiation for {}: {}", bookingId, e.getMessage());
        }
    }

    public static class BookingCheckoutResponse {
        private UUID id;
        private UUID userId;
        private String status;
        private BigDecimal totalAmount;

        public UUID getId() {
            return id;
        }

        public void setId(UUID id) {
            this.id = id;
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }

        public UUID getUserId() {
            return userId;
        }

        public void setUserId(UUID userId) {
            this.userId = userId;
        }

        public BigDecimal getTotalAmount() {
            return totalAmount;
        }

        public void setTotalAmount(BigDecimal totalAmount) {
            this.totalAmount = totalAmount;
        }
    }
}
