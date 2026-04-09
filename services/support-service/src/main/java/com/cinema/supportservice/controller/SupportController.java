package com.cinema.supportservice.controller;

import com.cinema.supportservice.repository.TicketRepository;
import com.cinema.supportservice.model.Ticket;
import com.cinema.supportservice.model.enums.TicketStatus;
import io.minio.GetObjectArgs;
import io.minio.MinioClient;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping({"/support", "/api/support"})
@RequiredArgsConstructor
public class SupportController {

    private final TicketRepository ticketRepository;
    private final MinioClient minioClient;

    @Value("${minio.bucket}")
    private String bucketName;

    // Get all tickets for a user
    @GetMapping("/tickets/user/{userId}")
    public ResponseEntity<List<Ticket>> getTicketsByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(ticketRepository.findByUserId(userId));
    }

    // Get all tickets for a booking
    @GetMapping("/tickets/booking/{bookingId}")
    public ResponseEntity<List<Ticket>> getTicketsByBooking(@PathVariable Long bookingId) {
        return ResponseEntity.ok(ticketRepository.findByBookingId(bookingId));
    }

    // Download QR code for a ticket
    @GetMapping("/tickets/{ticketId}/qr")
    public ResponseEntity<byte[]> downloadQr(@PathVariable UUID ticketId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        try (InputStream is = minioClient.getObject(
                GetObjectArgs.builder()
                        .bucket(bucketName)
                        .object(ticket.getQrObjectKey())
                        .build()
        ); ByteArrayOutputStream baos = new ByteArrayOutputStream()) {

            is.transferTo(baos);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"ticket-" + ticketId + ".png\"")
                    .contentType(MediaType.IMAGE_PNG)
                    .body(baos.toByteArray());

        } catch (Exception e) {
            throw new RuntimeException("Failed to download QR", e);
        }
    }

    @GetMapping("/bookings/{bookingId}/tickets")
    public ResponseEntity<List<Ticket>> getTicketsForBooking(@PathVariable Long bookingId) {
        List<Ticket> tickets = ticketRepository.findByBookingId(bookingId);
        return ResponseEntity.ok(tickets);
    }

    @GetMapping("/bookings/uuid/{bookingId}/tickets")
    public ResponseEntity<List<Ticket>> getTicketsForBookingUuid(@PathVariable UUID bookingId) {
        Long mappedBookingId = convertToLong(bookingId);
        List<Ticket> tickets = ticketRepository.findByBookingId(mappedBookingId);
        return ResponseEntity.ok(tickets);
    }
    // Staff ticket validation
    @PostMapping("/tickets/{ticketId}/validate")
    public ResponseEntity<Ticket> validateTicket(@PathVariable UUID ticketId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        if (ticket.getStatus() == TicketStatus.USED) {
            return ResponseEntity.badRequest().body(ticket);
        }

        ticket.setStatus(TicketStatus.USED);
        ticket.setValidatedAt(LocalDateTime.now());
        ticketRepository.save(ticket);

        return ResponseEntity.ok(ticket);
    }

    private Long convertToLong(UUID uuid) {
        String uuidStr = uuid.toString();
        String lastPart = uuidStr.substring(uuidStr.lastIndexOf('-') + 1);
        String numericPart = lastPart.replaceFirst("^0+(?!$)", "");
        if (numericPart.isEmpty()) {
            return 0L;
        }
        try {
            return Long.parseLong(numericPart);
        } catch (NumberFormatException e) {
            return (long) Math.abs(uuid.hashCode() % 10000);
        }
    }
}
