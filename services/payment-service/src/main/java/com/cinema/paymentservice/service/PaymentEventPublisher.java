package com.cinema.paymentservice.service;

import com.cinema.paymentservice.model.Payment;
import com.cinema.paymentservice.config.RabbitMQConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentEventPublisher {

    private final RabbitTemplate rabbitTemplate;

    public void publishPaymentSucceeded(Payment payment) {
        Map<String, Object> event = new HashMap<>();
        event.put("eventId", UUID.randomUUID().toString());
        event.put("paymentId", payment.getId().toString());
        event.put("bookingId", payment.getBookingId().toString());
        event.put("stripeSessionId", payment.getStripeSessionId());
        event.put("amount", payment.getAmount());
        event.put("currency", payment.getCurrency());
        event.put("occurredAt", Instant.now().toString());

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

    public void publishPaymentFailed(Payment payment, String reason) {
        Map<String, Object> event = new HashMap<>();
        event.put("eventId", UUID.randomUUID().toString());
        event.put("paymentId", payment.getId().toString());
        event.put("bookingId", payment.getBookingId().toString());
        event.put("stripeSessionId", payment.getStripeSessionId());
        event.put("reason", reason);
        event.put("occurredAt", Instant.now().toString());

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
}
