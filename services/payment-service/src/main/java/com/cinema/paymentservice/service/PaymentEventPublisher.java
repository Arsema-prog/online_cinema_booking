package com.cinema.paymentservice.service;

import com.cinema.paymentservice.model.Payment;
import com.cinema.paymentservice.config.RabbitMQConfig;
import com.cinema.paymentservice.messaging.PaymentOutcomeEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;

@Service
public class PaymentEventPublisher {

    private static final Logger log = LoggerFactory.getLogger(PaymentEventPublisher.class);

    private final RabbitTemplate rabbitTemplate;

    public PaymentEventPublisher(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    public void publishPaymentSucceeded(Payment payment, String stripeEventId) {
        PaymentOutcomeEvent event = buildBaseEvent(payment, stripeEventId);

        try {
            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.PAYMENT_EXCHANGE,
                    RabbitMQConfig.PAYMENT_SUCCEEDED_ROUTING_KEY,
                    event
            );
            log.info("Published payment.succeeded event for payment {}", payment.getId());
        } catch (Exception e) {
            log.error("Failed to publish payment.succeeded event", e);
        }
    }

    public void publishPaymentFailed(Payment payment, String stripeEventId, String reason) {
        PaymentOutcomeEvent event = buildBaseEvent(payment, stripeEventId);
        event.setReason(reason);

        try {
            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.PAYMENT_EXCHANGE,
                    RabbitMQConfig.PAYMENT_FAILED_ROUTING_KEY,
                    event
            );
            log.warn("Published payment.failed event for payment {} with reason: {}", payment.getId(), reason);
        } catch (Exception e) {
            log.error("Failed to publish payment.failed event", e);
        }
    }

    private PaymentOutcomeEvent buildBaseEvent(Payment payment, String stripeEventId) {
        PaymentOutcomeEvent event = new PaymentOutcomeEvent();
        event.setEventId(UUID.randomUUID().toString());
        event.setPaymentId(payment.getId());
        event.setBookingId(payment.getBookingId());
        event.setUserEmail(payment.getPayerEmail());
        event.setStripeEventId(stripeEventId);
        event.setStripeSessionId(payment.getStripeSessionId());
        event.setAmount(payment.getAmount());
        event.setCurrency(payment.getCurrency());
        event.setOccurredAt(Instant.now());
        return event;
    }
}
