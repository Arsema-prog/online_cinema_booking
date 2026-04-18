package com.cinema.supportservice.service;

import com.cinema.supportservice.dto.BookingConfirmedEvent;
import com.cinema.supportservice.model.Ticket;
import com.cinema.supportservice.model.enums.TicketStatus;
import com.cinema.supportservice.repository.TicketRepository;
import com.cinema.supportservice.util.QrCodeGenerator;
import com.google.zxing.WriterException;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.errors.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
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
    private final TicketQrPayloadService ticketQrPayloadService;

    @Value("${minio.bucket}")
    private String bucketName;

    @Value("${support.public-base-url:http://localhost:8090/api/v1/support}")
    private String supportPublicBaseUrl;

    @Transactional
    public List<String> generateTickets(BookingConfirmedEvent event) throws ServerException, InsufficientDataException, ErrorResponseException, IOException, NoSuchAlgorithmException, InvalidKeyException, InvalidResponseException, XmlParserException, WriterException, InternalException {

        // Convert UUID to Long for repository check
        Long bookingIdAsLong = convertToLong(event.getBookingId());
        if (ticketRepository.existsByBookingId(bookingIdAsLong)) {
            return getSignedUrlsForExistingTickets(bookingIdAsLong);
        }

        BigDecimal pricePerSeat = event.getTotalPrice()
                .divide(BigDecimal.valueOf(event.getSeats().size()), 2, RoundingMode.HALF_UP);

        List<String> ticketUrls = new ArrayList<>();

        for (String seat : event.getSeats()) {
            //UUID ticketId = UUID.randomUUID();
            Ticket ticket = new Ticket();
            //ticket.setId(ticketId);

            // CONVERT UUID TO LONG HERE
            ticket.setBookingId(convertToLong(event.getBookingId()));
            ticket.setUserId(convertToLong(event.getUserId()));

            ticket.setMovieTitle(event.getMovieTitle());
            ticket.setBranchName(event.getBranchName());
            ticket.setScreenName(event.getScreenName());
            ticket.setShowTime(event.getShowTime());
            ticket.setSeatNumber(seat);
            ticket.setPrice(pricePerSeat);
            ticket.setStatus(TicketStatus.ACTIVE);
            ticket.setIssuedAt(LocalDateTime.now());

            ticket.setTicketNumber("TIX-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
            ticket.setValidationToken(ticketQrPayloadService.newValidationToken());

            // 1️⃣ Always set a default QR path to satisfy NOT NULL
            String qrObjectKey = "tickets/" + UUID.randomUUID()  + ".png";
            ticket.setQrObjectKey(qrObjectKey);

            try {

                Ticket savedTicket = ticketRepository.save(ticket);
                UUID generatedTicketId = savedTicket.getId();  // Get the generated ID

                // Now use the generated ID for QR code
                String qrKey = "tickets/" + generatedTicketId + ".png";
                ticket.setQrObjectKey(qrKey);


                String qrPayload = ticket.getValidationToken();
                BufferedImage qrImage = QrCodeGenerator.generateQrCodeImage(qrPayload, 250, 250);
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
                ticketRepository.save(ticket);

                System.out.println("[INFO] QR uploaded for ticket: " + generatedTicketId);
                ticketUrls.add(buildPublicTicketUrl(generatedTicketId));
            } catch (Exception e) {
                System.err.println("[ERROR] Failed to process ticket: " + e.getMessage());
                e.printStackTrace();
                throw e;
            }

        }

        return ticketUrls;
    }

    @Transactional
    public List<String> generateTicketsAndEmail(BookingConfirmedEvent event, String userEmail) throws ServerException, InsufficientDataException, ErrorResponseException, IOException, NoSuchAlgorithmException, InvalidKeyException, InvalidResponseException, XmlParserException, WriterException, InternalException {
        List<String> signedUrls = generateTickets(event);

        if (userEmail != null && !userEmail.isBlank()) {
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

    private List<String> getSignedUrlsForExistingTickets(Long bookingId) {
        if (bookingId == null) {
            return List.of();
        }

        return ticketRepository.findByBookingId(bookingId).stream()
                .map(ticket -> {
                    if (ticket.getId() == null) {
                        return null;
                    }
                    return buildPublicTicketUrl(ticket.getId());
                })
                .filter(url -> url != null && !url.isBlank())
                .toList();
    }

    private String buildPublicTicketUrl(UUID ticketId) {
        String normalizedBase = supportPublicBaseUrl.endsWith("/")
                ? supportPublicBaseUrl.substring(0, supportPublicBaseUrl.length() - 1)
                : supportPublicBaseUrl;
        return normalizedBase + "/tickets/" + ticketId + "/qr";
    }

    /**
     * Converts a UUID to a Long by extracting the numeric part from the UUID.
     * Format expected: 00000000-0000-0000-0000-000000000012 -> 12
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
