package com.cinema.supportservice;

import com.cinema.supportservice.dto.BookingConfirmedEvent;
import com.cinema.supportservice.model.Ticket;
import com.cinema.supportservice.model.enums.TicketStatus;
import com.cinema.supportservice.service.TicketService;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

@Component
public class TestBookingPublisher implements CommandLineRunner {

    private final RabbitTemplate rabbitTemplate;
    private final TicketService ticketService; // inject TicketService

    public TestBookingPublisher(RabbitTemplate rabbitTemplate, TicketService ticketService) {
        this.rabbitTemplate = rabbitTemplate;
        this.ticketService = ticketService;
    }

    @Override
    public void run(String... args) throws Exception {
        // 1️⃣ Create test booking event
        BookingConfirmedEvent event = new BookingConfirmedEvent();
        event.setBookingId(ThreadLocalRandom.current().nextLong());
        event.setUserId(ThreadLocalRandom.current().nextLong());
        event.setUserEmail("arsematesfaye019@gmail.com");
        event.setMovieTitle("Test Movie");
        event.setBranchName("Main Branch");
        event.setScreenName("Screen 1");
        event.setShowTime(LocalDateTime.now().plusDays(1));
        event.setSeats(List.of("A1", "A2"));
        event.setTotalPrice(BigDecimal.valueOf(20));

        // 2️⃣ Create ticket locally
        Ticket ticket = new Ticket();
        ticket.setBookingId(event.getBookingId());
        ticket.setUserId(event.getUserId());
        ticket.setMovieTitle(event.getMovieTitle());
        ticket.setBranchName(event.getBranchName());
        ticket.setScreenName(event.getScreenName());
        ticket.setShowTime(event.getShowTime());
        ticket.setSeatNumber("A1"); // example
        ticket.setPrice(BigDecimal.valueOf(10)); // example
        ticket.setStatus(TicketStatus.ACTIVE); // make sure you import your enum
        ticket.setIssuedAt(LocalDateTime.now());
        // generate QR code path so NOT NULL is satisfied
        ticket.setQrObjectKey("tickets/" + UUID.randomUUID() + ".png");

// Optional: set PDF path if NOT NULL too
        ticket.setPdfObjectKey("tickets/" + UUID.randomUUID() + ".pdf");
        // 2️⃣ Send to RabbitMQ (optional, if you want the real listener to consume)
        rabbitTemplate.convertAndSend(
                "bookingConfirmedQueue", // must match your queue name in config
                event
        );
        System.out.println("Test BookingConfirmedEvent sent to RabbitMQ");

        // 3️⃣ Directly test ticket generation + email
        System.out.println("Testing Ticket Generation and Email Sending...");
        ticketService.generateTicketsAndEmail(event, event.getUserEmail());
        System.out.println("Tickets generated and email sent successfully!");
    }
}