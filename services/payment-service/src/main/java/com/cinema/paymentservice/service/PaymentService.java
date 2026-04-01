package com.cinema.paymentservice.service;

import com.cinema.paymentservice.dto.CreateCheckoutSessionRequest;
import com.cinema.paymentservice.dto.CheckoutSessionResponse;
import com.cinema.paymentservice.model.Payment;
import com.cinema.paymentservice.repository.PaymentRepository;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;
import com.stripe.model.Event;
import com.stripe.net.Webhook;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.client.RestTemplate;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${stripe.api-key}")
    private String stripeApiKey;

    @Value("${stripe.webhook-secret}")
    private String webhookSecret;

    @Value("${booking.service.url:http://localhost:8082}")
    private String bookingServiceUrl;

    @PostConstruct
    public void init() {
        Stripe.apiKey = stripeApiKey;
    }

    public CheckoutSessionResponse createCheckoutSession(CreateCheckoutSessionRequest request) throws StripeException {
        log.info("Creating checkout session for booking: {}", request.getBookingId());

        Long clientAmount = request.getAmount() != null ? request.getAmount() : 0L;
        Long amountInCents = resolveAmountFromBooking(request.getBookingId(), clientAmount);
        if (amountInCents == null || amountInCents <= 0) {
            throw new IllegalArgumentException("Amount must be greater than zero");
        }
        String normalizedCurrency = request.getCurrency() != null
                ? request.getCurrency().toUpperCase()
                : "USD";

        // For development with mock key, return mock response
        if (stripeApiKey.equals("sk_test_mock")) {
            log.info("Using mock checkout session response");
            String mockUrl = "http://localhost:5174/bookers/booking/success?bookingId=" + request.getBookingId() + "&session_id=mock_" + request.getBookingId();
            Payment mockPayment = buildPendingPayment(request.getBookingId(), "mock_session_" + request.getBookingId(), amountInCents, normalizedCurrency);
            paymentRepository.save(mockPayment);
            notifyBookingPaymentInitiated(request.getBookingId());
            return new CheckoutSessionResponse("mock_session_" + request.getBookingId(), mockUrl);
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

        Session session = Session.create(params);

        Payment payment = buildPendingPayment(request.getBookingId(), session.getId(), amountInCents, normalizedCurrency);
        paymentRepository.save(payment);
        notifyBookingPaymentInitiated(request.getBookingId());

        return new CheckoutSessionResponse(session.getId(), session.getUrl());
    }

    public void handleWebhook(String payload, String sigHeader) throws Exception {
        log.info("Received webhook: {}", payload);

        Event event = Webhook.constructEvent(payload, sigHeader, webhookSecret);

        switch (event.getType()) {
            case "checkout.session.completed":
                handleCheckoutSessionCompleted(event);
                break;
            case "checkout.session.async_payment_failed":
                handlePaymentFailed(event);
                break;
            default:
                log.info("Unhandled event type: {}", event.getType());
        }
    }

    private void handleCheckoutSessionCompleted(Event event) {
        Session session = (Session) event.getDataObjectDeserializer().getObject().orElse(null);
        if (session != null) {
            String bookingId = session.getMetadata().get("bookingId");
            log.info("Payment completed for booking: {}", bookingId);

            // Here you would call the booking service to confirm the booking
            try {
                if (bookingId != null) {
                    String url = bookingServiceUrl + "/bookings/" + bookingId + "/confirm";
                    log.info("Notifying booking service to confirm booking via: {}", url);
                    restTemplate.postForEntity(url, null, Void.class);
                    log.info("Booking {} confirmed via booking service", bookingId);
                } else {
                    log.warn("No bookingId metadata present on Stripe session {}");
                }
            } catch (Exception e) {
                log.error("Failed to confirm booking {} via booking service: {}", bookingId, e.getMessage());
            }
        }
    }

    private void handlePaymentFailed(Event event) {
        Session session = (Session) event.getDataObjectDeserializer().getObject().orElse(null);
        if (session != null) {
            String bookingId = session.getMetadata().get("bookingId");
            log.info("Payment failed for booking: {}", bookingId);

            // Here you would cancel the hold in the booking service
            try {
                if (bookingId != null) {
                    String url = bookingServiceUrl + "/bookings/" + bookingId + "/fail";
                    log.info("Notifying booking service to fail/cancel booking via: {}", url);
                    restTemplate.postForEntity(url, null, Void.class);
                    log.info("Booking {} marked failed via booking service", bookingId);
                } else {
                    log.warn("No bookingId metadata present on Stripe session {}");
                }
            } catch (Exception e) {
                log.error("Failed to notify booking service to fail booking {}: {}", bookingId, e.getMessage());
            }
        }
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

    private Long resolveAmountFromBooking(UUID bookingId, Long requestedAmount) {
        if (bookingId == null) {
            return requestedAmount;
        }

        try {
            var response = restTemplate.getForEntity(bookingServiceUrl + "/bookings/" + bookingId, BookingAmountResponse.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null && response.getBody().totalAmount() != null) {
                BigDecimal total = response.getBody().totalAmount();
                Long cents = total.multiply(BigDecimal.valueOf(100)).setScale(0, RoundingMode.HALF_UP).longValue();
                log.info("Resolved amount {} cents from booking service for booking {}", cents, bookingId);
                return cents;
            }
        } catch (Exception e) {
            log.warn("Failed to resolve amount from booking service for {}. Falling back to client amount. Error: {}", bookingId, e.getMessage());
        }

        return requestedAmount;
    }

    // Minimal DTO for booking lookup
    private record BookingAmountResponse(BigDecimal totalAmount) {}

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
}
