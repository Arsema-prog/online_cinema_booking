package com.cinema.supportservice.messaging;

import com.cinema.supportservice.dto.BookingConfirmedEvent;
import com.cinema.supportservice.service.TicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class BookingEventListener {

    private final TicketService ticketService;

    @RabbitListener(queues = "${rabbitmq.queue.bookingConfirmed}")
    public void handleBookingConfirmedEvent(BookingConfirmedEvent event) {
        try {
            // Call your service to generate tickets and email
            ticketService.generateTicketsAndEmail(event, event.getUserEmail());
            System.out.println("Tickets generated and emailed for booking: " + event.getBookingId());
        } catch (Exception e) {
            System.err.println("Failed to process booking event: " + e.getMessage());
            e.printStackTrace();
        }
    }
}