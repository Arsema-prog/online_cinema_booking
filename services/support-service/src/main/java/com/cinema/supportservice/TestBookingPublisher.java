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

@Component
public class TestBookingPublisher implements CommandLineRunner {

    private final RabbitTemplate rabbitTemplate;
    private final TicketService ticketService;

    public TestBookingPublisher(RabbitTemplate rabbitTemplate, TicketService ticketService) {
        this.rabbitTemplate = rabbitTemplate;
        this.ticketService = ticketService;
    }

    @Override
    public void run(String... args) throws Exception {
        // 1️⃣ Create test booking event with UUIDs
        BookingConfirmedEvent event = new BookingConfirmedEvent();

        // Use formatted UUIDs that match the expected pattern (with leading zeros)
        // This ensures convertToLong will work properly
        event.setBookingId(UUID.fromString("00000000-0000-0000-0000-000000000001"));
        event.setUserId(UUID.fromString("00000000-0000-0000-0000-000000000001"));

        event.setUserEmail("arsematesfaye019@gmail.com");
        event.setMovieTitle("Test Movie");
        event.setBranchName("Main Branch");
        event.setScreenName("Screen 1");
        event.setShowTime(LocalDateTime.now().plusDays(1));
        event.setSeats(List.of("A1", "A2"));
        event.setTotalPrice(BigDecimal.valueOf(20));

        // 2️⃣ Create ticket locally - CONVERT UUID TO LONG HERE
        Ticket ticket = new Ticket();

        // Convert UUID to Long using the same method as in TicketService
        event.setBookingId(UUID.fromString("00000000-0000-0000-0000-000000000001"));
        event.setUserId(UUID.fromString("00000000-0000-0000-0000-000000000001"));
        ticket.setMovieTitle(event.getMovieTitle());
        ticket.setBranchName(event.getBranchName());
        ticket.setScreenName(event.getScreenName());
        ticket.setShowTime(event.getShowTime());
        ticket.setSeatNumber("A1");
        ticket.setPrice(BigDecimal.valueOf(10));
        ticket.setStatus(TicketStatus.ACTIVE);
        ticket.setIssuedAt(LocalDateTime.now());

        // Generate QR code path so NOT NULL is satisfied
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

    /**
     * Helper method to convert UUID to Long (same as in TicketService)
     */
    private Long convertToLong(UUID uuid) {
        if (uuid == null) {
            return null;
        }

        String uuidStr = uuid.toString();
        // Get the last part after the last hyphen
        String lastPart = uuidStr.substring(uuidStr.lastIndexOf('-') + 1);

        // Remove leading zeros
        String numericPart = lastPart.replaceFirst("^0+(?!$)", "");

        if (numericPart.isEmpty()) {
            return 0L;
        }

        try {
            return Long.parseLong(numericPart);
        } catch (NumberFormatException e) {
            System.err.println("[ERROR] Failed to convert UUID to Long: " + uuid);
            // Fallback: use hash code as last resort
            return (long) Math.abs(uuid.hashCode() % 10000);
        }
    }
}