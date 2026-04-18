package com.cinema.paymentservice.controller;

import com.cinema.paymentservice.config.CorrelationIdFilter;
import com.cinema.paymentservice.model.PaymentEventInbox;
import com.cinema.paymentservice.model.Payment;
import com.cinema.paymentservice.repository.PaymentEventInboxRepository;
import com.cinema.paymentservice.repository.PaymentRepository;
import com.cinema.paymentservice.service.PaymentEventPublisher;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import org.slf4j.MDC;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;

@RestController
public class WebhookController {

    private static final Logger log = LoggerFactory.getLogger(WebhookController.class);

    private final PaymentRepository paymentRepository;
    private final PaymentEventInboxRepository paymentEventInboxRepository;
    private final PaymentEventPublisher eventPublisher;

    public WebhookController(
            PaymentRepository paymentRepository,
            PaymentEventInboxRepository paymentEventInboxRepository,
            PaymentEventPublisher eventPublisher
    ) {
        this.paymentRepository = paymentRepository;
        this.paymentEventInboxRepository = paymentEventInboxRepository;
        this.eventPublisher = eventPublisher;
    }

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

        MDC.put(CorrelationIdFilter.MDC_KEY, event.getId());
        try {
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
        } finally {
            MDC.remove(CorrelationIdFilter.MDC_KEY);
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

        if (paymentEventInboxRepository.existsById(stripeEventId)) {
            log.info("Event {} already processed, skipping", stripeEventId);
            return;
        }

        Payment payment = paymentRepository.findByStripeSessionId(sessionId)
                .orElseThrow(() -> new RuntimeException("Payment not found for session: " + sessionId));

        if (payment.getStatus() == Payment.PaymentStatus.SUCCEEDED) {
            persistProcessedEvent(stripeEventId, event.getType());
            log.info("Payment {} already succeeded, acknowledging duplicate success webhook", payment.getId());
            return;
        }

        payment.setStripeEventId(stripeEventId);
        payment.setStatus(Payment.PaymentStatus.SUCCEEDED);
        paymentRepository.save(payment);
        persistProcessedEvent(stripeEventId, event.getType());

        eventPublisher.publishPaymentSucceeded(payment, stripeEventId);

        log.info("Processed payment succeeded for session {}", sessionId);
    }

    @Transactional
    void handleCheckoutSessionFailed(Event event) {
        Session session = (Session) event.getDataObjectDeserializer().getObject().orElse(null);
        if (session == null) {
            log.error("Failed to deserialize failed-session payload from event {}", event.getId());
            return;
        }

        String stripeEventId = event.getId();
        String sessionId = session.getId();

        if (paymentEventInboxRepository.existsById(stripeEventId)) {
            log.info("Event {} already processed, skipping", stripeEventId);
            return;
        }

        Payment payment = paymentRepository.findByStripeSessionId(sessionId)
                .orElseThrow(() -> new RuntimeException("Payment not found for failed session: " + sessionId));

        if (payment.getStatus() == Payment.PaymentStatus.SUCCEEDED) {
            persistProcessedEvent(stripeEventId, event.getType());
            log.warn("Ignoring failure webhook for already succeeded payment {}", payment.getId());
            return;
        }

        payment.setStripeEventId(stripeEventId);
        payment.setStatus(Payment.PaymentStatus.FAILED);
        String failureReason = "Stripe event: " + event.getType();
        payment.setFailureReason(failureReason);
        paymentRepository.save(payment);
        persistProcessedEvent(stripeEventId, event.getType());

        eventPublisher.publishPaymentFailed(payment, stripeEventId, failureReason);

        log.info("Processed payment failure for session {}", sessionId);
    }

    private void persistProcessedEvent(String eventId, String eventType) {
        PaymentEventInbox inbox = new PaymentEventInbox();
        inbox.setEventId(eventId);
        inbox.setEventType(eventType);
        inbox.setProcessedAt(Instant.now());
        paymentEventInboxRepository.save(inbox);
    }
}
