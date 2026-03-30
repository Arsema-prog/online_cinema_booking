package com.cinema.paymentservice.service;

import com.cinema.paymentservice.dto.CreateCheckoutSessionRequest;
import com.cinema.paymentservice.dto.CheckoutSessionResponse;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;
import com.stripe.model.Event;
import com.stripe.net.Webhook;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    @Value("${stripe.api-key}")
    private String stripeApiKey;

    @Value("${stripe.webhook-secret}")
    private String webhookSecret;

    @PostConstruct
    public void init() {
        Stripe.apiKey = stripeApiKey;
    }

    public CheckoutSessionResponse createCheckoutSession(CreateCheckoutSessionRequest request) throws StripeException {
        log.info("Creating checkout session for booking: {}", request.getBookingId());

        // For development with mock key, return mock response
        if (stripeApiKey.equals("sk_test_mock")) {
            log.info("Using mock checkout session response");
            String mockUrl = "http://localhost:5174/bookers/booking/success?bookingId=" + request.getBookingId() + "&session_id=mock_" + request.getBookingId();
            return new CheckoutSessionResponse("mock_session_" + request.getBookingId(), mockUrl);
        }

        // Real Stripe integration
        Map<String, Object> params = new HashMap<>();
        params.put("success_url", request.getSuccessUrl());
        params.put("cancel_url", request.getCancelUrl());
        params.put("mode", "payment");

        Map<String, Object> lineItem = new HashMap<>();
        lineItem.put("price_data", Map.of(
                "currency", request.getCurrency(),
                "unit_amount", request.getAmount(),
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
            // For now, just log it
            log.info("Booking {} should be confirmed", bookingId);
        }
    }

    private void handlePaymentFailed(Event event) {
        Session session = (Session) event.getDataObjectDeserializer().getObject().orElse(null);
        if (session != null) {
            String bookingId = session.getMetadata().get("bookingId");
            log.info("Payment failed for booking: {}", bookingId);

            // Here you would cancel the hold in the booking service
            log.info("Booking {} should be cancelled", bookingId);
        }
    }
}