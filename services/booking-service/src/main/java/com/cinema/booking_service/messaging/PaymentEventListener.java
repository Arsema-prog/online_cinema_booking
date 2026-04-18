package com.cinema.booking_service.messaging;

import com.cinema.booking_service.config.RabbitConfig;
import com.cinema.booking_service.config.CorrelationIdFilter;
import com.cinema.booking_service.domain.MessageInbox;
import com.cinema.booking_service.repository.MessageInboxRepository;
import com.cinema.booking_service.service.BookingService;
import lombok.extern.slf4j.Slf4j;
import lombok.RequiredArgsConstructor;
import org.slf4j.MDC;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.support.AmqpHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Slf4j
@Component
@RequiredArgsConstructor
public class PaymentEventListener {

    private final BookingService bookingService;
    private final MessageInboxRepository inboxRepository;

    @RabbitListener(queues = RabbitConfig.PAYMENT_SUCCESS_QUEUE)
    public void handlePaymentSuccess(
            PaymentSuccessEvent event,
            @Header(name = CorrelationIdFilter.CORRELATION_ID_HEADER, required = false) String correlationId,
            @Header(name = AmqpHeaders.CORRELATION_ID, required = false) String amqpCorrelationId
    ) {
        String cid = (correlationId != null && !correlationId.isBlank()) ? correlationId : amqpCorrelationId;
        if (cid != null && !cid.isBlank()) MDC.put(CorrelationIdFilter.MDC_KEY, cid);
        try {
            if (event == null || event.getEventId() == null || event.getEventId().isBlank()) {
                throw new IllegalArgumentException("Missing eventId on payment.succeeded message");
            }
            if (inboxRepository.existsById(event.getEventId())) {
                log.info("Duplicate payment.succeeded event {}, skipping", event.getEventId());
                return;
            }
            bookingService.confirmBooking(event.getBookingId(), event.getUserEmail());
            inboxRepository.save(MessageInbox.builder()
                    .eventId(event.getEventId())
                    .eventType("payment.succeeded")
                    .receivedAt(LocalDateTime.now())
                    .processedAt(LocalDateTime.now())
                    .build());
        } finally {
            MDC.remove(CorrelationIdFilter.MDC_KEY);
        }
    }

    @RabbitListener(queues = RabbitConfig.PAYMENT_FAILED_QUEUE)
    public void handlePaymentFailed(
            PaymentFailedEvent event,
            @Header(name = CorrelationIdFilter.CORRELATION_ID_HEADER, required = false) String correlationId,
            @Header(name = AmqpHeaders.CORRELATION_ID, required = false) String amqpCorrelationId
    ) {
        String cid = (correlationId != null && !correlationId.isBlank()) ? correlationId : amqpCorrelationId;
        if (cid != null && !cid.isBlank()) MDC.put(CorrelationIdFilter.MDC_KEY, cid);
        try {
            if (event == null || event.getEventId() == null || event.getEventId().isBlank()) {
                throw new IllegalArgumentException("Missing eventId on payment.failed message");
            }
            if (inboxRepository.existsById(event.getEventId())) {
                log.info("Duplicate payment.failed event {}, skipping", event.getEventId());
                return;
            }
            log.warn("Received payment failure for booking {}. Reason: {}", event.getBookingId(), event.getReason());
            bookingService.failBooking(event.getBookingId());
            inboxRepository.save(MessageInbox.builder()
                    .eventId(event.getEventId())
                    .eventType("payment.failed")
                    .receivedAt(LocalDateTime.now())
                    .processedAt(LocalDateTime.now())
                    .build());
        } finally {
            MDC.remove(CorrelationIdFilter.MDC_KEY);
        }
    }
}
