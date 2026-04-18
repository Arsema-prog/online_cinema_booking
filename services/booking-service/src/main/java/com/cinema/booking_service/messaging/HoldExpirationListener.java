package com.cinema.booking_service.messaging;

import com.cinema.booking_service.config.CorrelationIdFilter;
import com.cinema.booking_service.config.RabbitConfig;
import com.cinema.booking_service.service.BookingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.support.AmqpHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class HoldExpirationListener {

    private final BookingService bookingService;

    @RabbitListener(queues = RabbitConfig.HOLD_EXPIRED_QUEUE)
    public void handleHoldExpiration(
            HoldExpirationEvent event,
            @Header(name = CorrelationIdFilter.CORRELATION_ID_HEADER, required = false) String correlationId,
            @Header(name = AmqpHeaders.CORRELATION_ID, required = false) String amqpCorrelationId
    ) {
        String cid = (correlationId != null && !correlationId.isBlank()) ? correlationId : amqpCorrelationId;
        if (cid != null && !cid.isBlank()) {
            MDC.put(CorrelationIdFilter.MDC_KEY, cid);
        }

        try {
            if (event == null || event.getBookingId() == null) {
                throw new IllegalArgumentException("Missing bookingId on hold expiration message");
            }

            bookingService.expireBookingDueToTimeout(event.getBookingId());
            log.info("Processed hold expiration event {} for booking {}", event.getEventId(), event.getBookingId());
        } finally {
            MDC.remove(CorrelationIdFilter.MDC_KEY);
        }
    }
}
