package com.cinema.supportservice.messaging;

import com.cinema.supportservice.dto.BookingConfirmedEvent;
import com.cinema.supportservice.config.CorrelationIdFilter;
import com.cinema.supportservice.model.MessageInbox;
import com.cinema.supportservice.repository.MessageInboxRepository;
import com.cinema.supportservice.service.TicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.support.AmqpHeaders;
import org.springframework.dao.DataIntegrityViolationException;
import org.slf4j.MDC;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Component
@RequiredArgsConstructor
public class BookingEventListener {

    private static final Logger log = LoggerFactory.getLogger(BookingEventListener.class);

    private final TicketService ticketService;
    private final MessageInboxRepository messageInboxRepository;

    @RabbitListener(queues = "${rabbitmq.queue.bookingConfirmed}")
    @Transactional
    public void handleBookingConfirmedEvent(
            BookingConfirmedEvent event,
            @Header(name = CorrelationIdFilter.CORRELATION_ID_HEADER, required = false) String correlationId,
            @Header(name = AmqpHeaders.CORRELATION_ID, required = false) String amqpCorrelationId,
            @Header(name = "eventId", required = false) String eventId
    ) {
        String cid = (correlationId != null && !correlationId.isBlank()) ? correlationId : amqpCorrelationId;
        if (cid != null && !cid.isBlank()) MDC.put(CorrelationIdFilter.MDC_KEY, cid);
        try {
            String idempotencyKey = (eventId != null && !eventId.isBlank())
                    ? eventId
                    : "booking-confirmed:" + event.getBookingId();

            if (messageInboxRepository.existsById(idempotencyKey)) {
                log.info("Skipping already processed booking-confirmed event {}", idempotencyKey);
                return;
            }

            ticketService.generateTicketsAndEmail(event, event.getUserEmail());
            MessageInbox inbox = new MessageInbox();
            inbox.setEventId(idempotencyKey);
            inbox.setEventType("booking.confirmed");
            inbox.setProcessedAt(Instant.now());
            messageInboxRepository.save(inbox);
            log.info("Tickets generated and emailed for booking {}", event.getBookingId());
        } catch (DataIntegrityViolationException duplicate) {
            log.info("Duplicate event detected for booking {}, ignoring", event.getBookingId());
        } catch (Exception e) {
            log.error("Failed to process booking event for {}", event.getBookingId(), e);
            if (e instanceof RuntimeException re) {
                throw re;
            }
            throw new RuntimeException(e);
        } finally {
            MDC.remove(CorrelationIdFilter.MDC_KEY);
        }
    }
}