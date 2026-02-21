package com.cinema.supportservice.service;

import com.cinema.supportservice.dto.BookingConfirmedEvent;
import com.cinema.supportservice.model.Ticket;
import com.cinema.supportservice.model.enums.TicketStatus;
import com.cinema.supportservice.repository.TicketRepository;
import com.cinema.supportservice.util.QrCodeGenerator;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TicketService {

    private final TicketRepository ticketRepository;
    private final MinioClient minioClient;
    private final MinioService minioService;
    private final EmailService emailService;

    @Value("${minio.bucket}")
    private String bucketName;

    @Transactional
    public List<String> generateTickets(BookingConfirmedEvent event) {

        if (ticketRepository.existsByBookingId(event.getBookingId())) {
            return List.of(); // prevent duplicates
        }

        BigDecimal pricePerSeat = event.getTotalPrice()
                .divide(BigDecimal.valueOf(event.getSeats().size()), 2, RoundingMode.HALF_UP);

        List<String> signedUrls = new ArrayList<>();

        for (String seat : event.getSeats()) {
            UUID ticketId = UUID.randomUUID();
            Ticket ticket = new Ticket();

            ticket.setBookingId(event.getBookingId());
            ticket.setUserId(event.getUserId());
            ticket.setMovieTitle(event.getMovieTitle());
            ticket.setBranchName(event.getBranchName());
            ticket.setScreenName(event.getScreenName());
            ticket.setShowTime(event.getShowTime());
            ticket.setSeatNumber(seat);
            ticket.setPrice(pricePerSeat);
            ticket.setStatus(TicketStatus.ACTIVE);
            ticket.setIssuedAt(LocalDateTime.now());

            // 1️⃣ Always set a default QR path to satisfy NOT NULL
            String qrObjectKey = "tickets/" + ticketId + ".png";
            ticket.setQrObjectKey(qrObjectKey);

            try {
                // Generate QR code image
                BufferedImage qrImage = QrCodeGenerator.generateQrCodeImage(ticketId.toString(), 250, 250);
                ByteArrayOutputStream baos = new ByteArrayOutputStream();
                ImageIO.write(qrImage, "PNG", baos);
                byte[] qrBytes = baos.toByteArray();

                // Upload QR to MinIO
                minioClient.putObject(
                        PutObjectArgs.builder()
                                .bucket(bucketName)
                                .object(qrObjectKey)
                                .stream(new ByteArrayInputStream(qrBytes), qrBytes.length, -1)
                                .contentType("image/png")
                                .build()
                );

                System.out.println("[INFO] QR uploaded for ticket: " + ticketId);

            } catch (Exception e) {
                // Log full error but keep qrObjectKey set
                System.err.println("[ERROR] Failed to generate/upload QR for ticket: " + ticketId);
                e.printStackTrace();
            }

            try {
                ticketRepository.save(ticket);
                System.out.println("[INFO] Ticket saved successfully: " + ticketId);
            } catch (Exception e) {
                System.err.println("[ERROR] Failed to save ticket: " + ticketId);
                System.err.println("Ticket object: " + ticket);
                e.printStackTrace();
                throw e;
            }

            try {
                // Generate signed URL (even if upload failed, URL points to intended path)
                String signedUrl = minioService.getSignedUrl(qrObjectKey, 10);
                signedUrls.add(signedUrl);
            } catch (Exception e) {
                System.err.println("[WARN] Failed to generate signed URL for ticket: " + ticketId);
                e.printStackTrace();
            }
        }

        return signedUrls;
    }

    @Transactional
    public List<String> generateTicketsAndEmail(BookingConfirmedEvent event, String userEmail) {
        List<String> signedUrls = generateTickets(event);

        if (!signedUrls.isEmpty() && userEmail != null && !userEmail.isBlank()) {
            try {
                emailService.sendTicketEmails(userEmail, signedUrls);
                System.out.println("[INFO] Ticket email sent to: " + userEmail);
            } catch (Exception e) {
                System.err.println("[ERROR] Failed to send ticket email to: " + userEmail);
                e.printStackTrace();
            }
        }

        return signedUrls;
    }
}