package com.cinema.booking_service.messaging;

import com.cinema.booking_service.config.RabbitConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class HoldExpirationPublisher {

    private final RabbitTemplate rabbitTemplate;

    public void scheduleHoldExpiration(UUID bookingId, UUID showId, UUID userId, LocalDateTime expiresAt) {
        HoldExpirationEvent event = HoldExpirationEvent.builder()
                .eventId(UUID.randomUUID().toString())
                .bookingId(bookingId)
                .showId(showId)
                .userId(userId)
                .expiresAt(expiresAt)
                .occurredAt(LocalDateTime.now())
                .build();

        rabbitTemplate.convertAndSend(
                RabbitConfig.BOOKING_EXCHANGE,
                RabbitConfig.HOLD_EXPIRATION_ROUTING_KEY,
                event
        );

        log.info("Scheduled hold expiration for booking {} at {}", bookingId, expiresAt);
    }
}
