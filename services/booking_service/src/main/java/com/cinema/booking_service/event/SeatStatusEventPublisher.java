// booking-service: com/cinema/booking_service/event/SeatStatusEventPublisher.java
package com.cinema.booking_service.event;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static com.cinema.booking_service.config.RabbitConfig.BOOKING_EXCHANGE;
import static com.cinema.booking_service.config.RabbitConfig.SEAT_STATUS_ROUTING_KEY;

@Slf4j
@Component
@RequiredArgsConstructor
public class SeatStatusEventPublisher {

    private final RabbitTemplate rabbitTemplate;

    public void publishSeatHeldEvent(UUID showId, List<Long> seatIds, UUID bookingId, String userId) {
        SeatStatusEvent event = new SeatStatusEvent(
                "SEAT_HELD",
                showId,
                seatIds,
                bookingId,
                userId,
                LocalDateTime.now()
        );

        rabbitTemplate.convertAndSend(BOOKING_EXCHANGE, SEAT_STATUS_ROUTING_KEY, event);
        log.info("✅ Published SEAT_HELD event for booking: {} with {} seats", bookingId, seatIds.size());
    }

    public void publishSeatReservedEvent(UUID showId, List<Long> seatIds, UUID bookingId, String userId) {
        SeatStatusEvent event = new SeatStatusEvent(
                "SEAT_RESERVED",
                showId,
                seatIds,
                bookingId,
                userId,
                LocalDateTime.now()
        );

        rabbitTemplate.convertAndSend(BOOKING_EXCHANGE, SEAT_STATUS_ROUTING_KEY, event);
        log.info("✅ Published SEAT_RESERVED event for booking: {}", bookingId);
    }

    public void publishSeatCancelledEvent(UUID showId, List<Long> seatIds, UUID bookingId, String userId) {
        SeatStatusEvent event = new SeatStatusEvent(
                "SEAT_CANCELLED",
                showId,
                seatIds,
                bookingId,
                userId,
                LocalDateTime.now()
        );

        rabbitTemplate.convertAndSend(BOOKING_EXCHANGE, SEAT_STATUS_ROUTING_KEY, event);
        log.info("✅ Published SEAT_CANCELLED event for booking: {}", bookingId);
    }
}