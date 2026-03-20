package com.cinema.paymentservice.controller;

import com.cinema.paymentservice.model.Payment;
import com.cinema.paymentservice.repository.PaymentRepository;
import com.cinema.paymentservice.service.PaymentEventPublisher;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

import java.util.Optional;

@Slf4j
@RestController
@RequiredArgsConstructor
public class WebhookController {

    private final PaymentRepository paymentRepository;
    private final PaymentEventPublisher eventPublisher;

    @Value("${stripe.webhook-secret}")
    private String webhookSecret;

    @PostMapping("/api/payments/webhook")
    public ResponseEntity<String> handleStripeWebhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String sigHeader) {

        Event event;
        try {
            // Verify webhook signature
            event = Webhook.constructEvent(payload, sigHeader, webhookSecret);
        } catch (SignatureVerificationException e) {
            log.warn("Invalid signature: {}", e.getMessage());
            return ResponseEntity.status(400).body("Invalid signature");
        }

        // Process the event
        switch (event.getType()) {
            case "checkout.session.completed":
                handleCheckoutSessionCompleted(event);
                break;
            case "checkout.session.expired":
            case "checkout.session.async_payment_failed":
                handleCheckoutSessionFailed(event);
                break;
            default:
                log.info("Unhandled event type: {}", event.getType());
        }

        return ResponseEntity.ok().build();
    }

    @Transactional
    void handleCheckoutSessionCompleted(Event event) {
        Session session = (Session) event.getDataObjectDeserializer().getObject().orElse(null);
        if (session == null) {
            log.error("Failed to deserialize session from event {}", event.getId());
            return;
        }

        String stripeEventId = event.getId();
        String sessionId = session.getId();

        // Idempotency: check if already processed
        Optional<Payment> existing = paymentRepository.findByStripeEventId(stripeEventId);
        if (existing.isPresent()) {
            log.info("Event {} already processed, skipping", stripeEventId);
            return;
        }

        // Find payment by session id
        Payment payment = paymentRepository.findByStripeSessionId(sessionId)
                .orElseThrow(() -> new RuntimeException("Payment not found for session: " + sessionId));

        // Update payment record
        payment.setStripeEventId(stripeEventId);
        payment.setStatus(Payment.PaymentStatus.SUCCEEDED);
        paymentRepository.save(payment);

        // Publish payment.succeeded event
        eventPublisher.publishPaymentSucceeded(payment);

        log.info("Processed payment succeeded for session {}", sessionId);
    }

    @Transactional
    void handleCheckoutSessionFailed(Event event) {
        // Similar but set status FAILED and publish payment.failed
        // ... (omitted for brevity, but similar pattern)
    }
}