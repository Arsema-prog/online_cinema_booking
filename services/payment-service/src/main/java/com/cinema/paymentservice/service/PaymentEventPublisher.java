package com.cinema.paymentservice.service;

import com.cinema.paymentservice.model.Payment;
import com.fasterxml.jackson.databind.ObjectMapper;
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
    private final ObjectMapper objectMapper;

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
            String json = objectMapper.writeValueAsString(event);
            rabbitTemplate.convertAndSend("payment.exchange", "payment.succeeded", json);
            log.info("Published payment.succeeded event for payment {}", payment.getId());
        } catch (Exception e) {
            log.error("Failed to publish payment.succeeded event", e);
        }
    }

    public void publishPaymentFailed(Payment payment, String reason) {
        // similar, with routing key "payment.failed"
        // ...
    }
}