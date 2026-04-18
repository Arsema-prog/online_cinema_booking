//package com.cinema.supportservice.controller;
//
//import com.cinema.supportservice.repository.TicketRepository;
//import com.cinema.supportservice.model.Ticket;
//import com.cinema.supportservice.model.enums.TicketStatus;
//import io.minio.GetObjectArgs;
//import io.minio.MinioClient;
//import lombok.RequiredArgsConstructor;
//import org.springframework.beans.factory.annotation.Value;
//import org.springframework.http.HttpHeaders;
//import org.springframework.http.MediaType;
//import org.springframework.http.ResponseEntity;
//import org.springframework.web.bind.annotation.*;
//import org.apache.pdfbox.pdmodel.PDDocument;
//import org.apache.pdfbox.rendering.PDFRenderer;
//import org.springframework.web.multipart.MultipartFile;
//import com.google.zxing.*;
//import com.google.zxing.client.j2se.BufferedImageLuminanceSource;
//import com.google.zxing.common.HybridBinarizer;
//import org.springframework.web.multipart.MultipartFile;
//import javax.imageio.ImageIO;
//import java.awt.image.BufferedImage;
//import java.util.HashMap;
//import java.util.Map;
//import java.util.UUID;
//import java.io.ByteArrayOutputStream;
//import java.io.InputStream;
//import java.time.LocalDateTime;
//import java.util.List;
//
//
//@RestController
//@RequestMapping({"/support", "/api/support"})
//@RequiredArgsConstructor
//public class SupportController {
//
//    private final TicketRepository ticketRepository;
//    private final MinioClient minioClient;
//
//    @Value("${minio.bucket}")
//    private String bucketName;
//
//    // Get all tickets for a user
//    @GetMapping("/tickets/user/{userId}")
//    public ResponseEntity<List<Ticket>> getTicketsByUser(@PathVariable Long userId) {
//        return ResponseEntity.ok(ticketRepository.findByUserId(userId));
//    }
//
//    // Get all tickets for a booking
//    @GetMapping("/tickets/booking/{bookingId}")
//    public ResponseEntity<List<Ticket>> getTicketsByBooking(@PathVariable Long bookingId) {
//        return ResponseEntity.ok(ticketRepository.findByBookingId(bookingId));
//    }
//
//    // Download QR code for a ticket
//    @GetMapping("/tickets/{ticketId}/qr")
//    public ResponseEntity<byte[]> downloadQr(@PathVariable UUID ticketId) {
//        Ticket ticket = ticketRepository.findById(ticketId)
//                .orElseThrow(() -> new RuntimeException("Ticket not found"));
//
//        try (InputStream is = minioClient.getObject(
//                GetObjectArgs.builder()
//                        .bucket(bucketName)
//                        .object(ticket.getQrObjectKey())
//                        .build()
//        ); ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
//
//            is.transferTo(baos);
//
//            return ResponseEntity.ok()
//                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"ticket-" + ticketId + ".png\"")
//                    .contentType(MediaType.IMAGE_PNG)
//                    .body(baos.toByteArray());
//
//        } catch (Exception e) {
//            throw new RuntimeException("Failed to download QR", e);
//        }
//    }
//
//    @GetMapping("/bookings/{bookingId}/tickets")
//    public ResponseEntity<List<Ticket>> getTicketsForBooking(@PathVariable Long bookingId) {
//        List<Ticket> tickets = ticketRepository.findByBookingId(bookingId);
//        return ResponseEntity.ok(tickets);
//    }
//
//    @GetMapping("/bookings/uuid/{bookingId}/tickets")
//    public ResponseEntity<List<Ticket>> getTicketsForBookingUuid(@PathVariable UUID bookingId) {
//        Long mappedBookingId = convertToLong(bookingId);
//        List<Ticket> tickets = ticketRepository.findByBookingId(mappedBookingId);
//        return ResponseEntity.ok(tickets);
//    }
//
//    private Long convertToLong(UUID uuid) {
//        return Math.abs(uuid.getMostSignificantBits());
//    }
//    // Staff ticket validation
//    @PostMapping("/tickets/{ticketId}/validate")
//    public ResponseEntity<Ticket> validateTicket(@PathVariable UUID ticketId) {
//        Ticket ticket = ticketRepository.findById(ticketId)
//                .orElseThrow(() -> new RuntimeException("Ticket not found"));
//
//        if (ticket.getStatus() == TicketStatus.USED) {
//            return ResponseEntity.badRequest().body(ticket);
//        }
//
//        ticket.setStatus(TicketStatus.USED);
//        ticket.setValidatedAt(LocalDateTime.now());
//        ticketRepository.save(ticket);
//
//        return ResponseEntity.ok(ticket);
//    }
//
//    // Get ticket details for validation (used by QR scanner)
//    @GetMapping("/tickets/{ticketId}/details")
//    public ResponseEntity<Ticket> getTicketDetails(@PathVariable UUID ticketId) {
//        Ticket ticket = ticketRepository.findById(ticketId)
//                .orElseThrow(() -> new RuntimeException("Ticket not found"));
//
//        return ResponseEntity.ok(ticket);
//    }
//
//    @PostMapping("/tickets/scan-qr")
//    public ResponseEntity<?> scanQRCodeFromImage(@RequestParam("qrImage") MultipartFile qrImage) {
//        try {
//            // Validate file
//            if (qrImage.isEmpty()) {
//                return ResponseEntity.badRequest().body(Map.of("error", "No image file provided"));
//            }
//
//            // Validate file type
//            String contentType = qrImage.getContentType();
//            if (contentType == null || !contentType.startsWith("image/")) {
//                return ResponseEntity.badRequest().body(Map.of("error", "Invalid file type. Please upload an image."));
//            }
//
//            // Validate file size (5MB max)
//            if (qrImage.getSize() > 5 * 1024 * 1024) {
//                return ResponseEntity.badRequest().body(Map.of("error", "File too large. Maximum size is 5MB."));
//            }
//
//            // Read image
//            BufferedImage bufferedImage = ImageIO.read(qrImage.getInputStream());
//            if (bufferedImage == null) {
//                return ResponseEntity.badRequest().body(Map.of("error", "Could not read image file"));
//            }
//
//            // Scan for QR code
//            LuminanceSource source = new BufferedImageLuminanceSource(bufferedImage);
//            BinaryBitmap bitmap = new BinaryBitmap(new HybridBinarizer(source));
//            MultiFormatReader reader = new MultiFormatReader();
//
//            Result result;
//            try {
//                result = reader.decode(bitmap);
//            } catch (NotFoundException e) {
//                return ResponseEntity.badRequest().body(Map.of("error", "No QR code found in the image. Please ensure the QR code is clearly visible."));
//            }
//
//            String decodedText = result.getText();
//            String ticketId = extractTicketIdFromUrl(decodedText);
//
//            // Validate ticket ID format
//            if (ticketId == null || !isValidUUID(ticketId)) {
//                return ResponseEntity.badRequest().body(Map.of("error", "Invalid QR code format. This does not appear to be a valid ticket QR code."));
//            }
//
//            // Check if ticket exists
//            UUID ticketUUID = UUID.fromString(ticketId);
//            Ticket ticket = ticketRepository.findById(ticketUUID).orElse(null);
//
//            if (ticket == null) {
//                return ResponseEntity.badRequest().body(Map.of("error", "Ticket not found. The QR code may be invalid."));
//            }
//
//            Map<String, String> response = new HashMap<>();
//            response.put("ticketId", ticketId);
//            response.put("status", ticket.getStatus().toString());
//            response.put("message", "QR code scanned successfully");
//
//            return ResponseEntity.ok(response);
//
//        } catch (Exception e) {
//            e.printStackTrace();
//            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to scan QR code: " + e.getMessage()));
//        }
//    }
//
//    // Helper method to extract ticket ID from URL
//    private String extractTicketIdFromUrl(String decodedText) {
//        // Check if it's a full URL
//        if (decodedText.contains("ticketId=")) {
//            try {
//                // Extract from URL parameter
//                String[] parts = decodedText.split("ticketId=");
//                if (parts.length > 1) {
//                    String idPart = parts[1];
//                    // Remove any additional parameters
//                    int ampIndex = idPart.indexOf('&');
//                    if (ampIndex != -1) {
//                        idPart = idPart.substring(0, ampIndex);
//                    }
//                    return idPart;
//                }
//            } catch (Exception e) {
//                // Fall through to direct ID check
//            }
//        }
//
//        // Check if it's directly a UUID
//        if (decodedText.matches("^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$")) {
//            return decodedText;
//        }
//
//        return null;
//    }
//
//    // Helper method to validate UUID format
//    private boolean isValidUUID(String uuidStr) {
//        try {
//            UUID.fromString(uuidStr);
//            return true;
//        } catch (IllegalArgumentException e) {
//            return false;
//        }
//    }
//
//    @PostMapping("/tickets/scan-from-file")
//    public ResponseEntity<?> scanTicketFromFile(@RequestParam("ticketFile") MultipartFile ticketFile) {
//        try {
//            // Validate file
//            if (ticketFile.isEmpty()) {
//                return ResponseEntity.badRequest().body(Map.of("error", "No file provided"));
//            }
//
//            String fileName = ticketFile.getOriginalFilename();
//            String contentType = ticketFile.getContentType();
//            BufferedImage imageToScan = null;
//
//            // Handle PDF files
//            if (fileName != null && fileName.toLowerCase().endsWith(".pdf")) {
//                try (PDDocument document = PDDocument.load(ticketFile.getInputStream())) {
//                    PDFRenderer renderer = new PDFRenderer(document);
//                    // Render first page of PDF (where QR code should be)
//                    BufferedImage pdfPageImage = renderer.renderImageWithDPI(0, 300);
//
//                    // Find QR code in the PDF page
//                    imageToScan = findQRCodeInImage(pdfPageImage);
//
//                    if (imageToScan == null) {
//                        // Try to find QR code by scanning the entire page
//                        imageToScan = pdfPageImage;
//                    }
//                } catch (Exception e) {
//                    return ResponseEntity.badRequest().body(Map.of("error", "Failed to process PDF: " + e.getMessage()));
//                }
//            }
//            // Handle image files
//            else if (contentType != null && contentType.startsWith("image/")) {
//                imageToScan = ImageIO.read(ticketFile.getInputStream());
//                if (imageToScan == null) {
//                    return ResponseEntity.badRequest().body(Map.of("error", "Could not read image file"));
//                }
//            }
//            else {
//                return ResponseEntity.badRequest().body(Map.of("error", "Unsupported file type. Please upload PDF or image files."));
//            }
//
//            // Scan for QR code
//            String ticketId = scanQRCodeFromImage(imageToScan);
//
//            if (ticketId == null) {
//                return ResponseEntity.badRequest().body(Map.of("error", "No QR code found in the file. Please ensure the ticket contains a visible QR code."));
//            }
//
//            // Validate ticket ID format
//            if (!isValidUUID(ticketId)) {
//                return ResponseEntity.badRequest().body(Map.of("error", "Invalid QR code format. This does not appear to be a valid ticket QR code."));
//            }
//
//            // Check if ticket exists
//            UUID ticketUUID = UUID.fromString(ticketId);
//            Ticket ticket = ticketRepository.findById(ticketUUID).orElse(null);
//
//            if (ticket == null) {
//                return ResponseEntity.badRequest().body(Map.of("error", "Ticket not found. The QR code may be invalid."));
//            }
//
//            Map<String, String> response = new HashMap<>();
//            response.put("ticketId", ticketId);
//            response.put("status", ticket.getStatus().toString());
//            response.put("message", "Ticket scanned successfully");
//
//            return ResponseEntity.ok(response);
//
//        } catch (Exception e) {
//            e.printStackTrace();
//            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to scan ticket: " + e.getMessage()));
//        }
//    }
//
//    // Helper method to find QR code in an image
//    private BufferedImage findQRCodeInImage(BufferedImage image) {
//        try {
//            LuminanceSource source = new BufferedImageLuminanceSource(image);
//            BinaryBitmap bitmap = new BinaryBitmap(new HybridBinarizer(source));
//            MultiFormatReader reader = new MultiFormatReader();
//
//            Result result = reader.decode(bitmap);
//            if (result != null && result.getText() != null) {
//                // QR code found, return the image
//                return image;
//            }
//        } catch (NotFoundException e) {
//            // Try to find QR code by scanning subregions
//            int width = image.getWidth();
//            int height = image.getHeight();
//
//            // Scan quadrants of the image
//            int[] xOffsets = {0, width/4, width/2, 3*width/4};
//            int[] yOffsets = {0, height/4, height/2, 3*height/4};
//
//            for (int xOffset : xOffsets) {
//                for (int yOffset : yOffsets) {
//                    int scanWidth = Math.min(width/2, width - xOffset);
//                    int scanHeight = Math.min(height/2, height - yOffset);
//
//                    if (scanWidth > 100 && scanHeight > 100) {
//                        BufferedImage subImage = image.getSubimage(xOffset, yOffset, scanWidth, scanHeight);
//                        try {
//                            source = new BufferedImageLuminanceSource(subImage);
//                            bitmap = new BinaryBitmap(new HybridBinarizer(source));
//                            Result subResult = reader.decode(bitmap);
//                            if (subResult != null && subResult.getText() != null) {
//                                return subImage;
//                            }
//                        } catch (NotFoundException ignored) {
//                            // Continue searching
//                        }
//                    }
//                }
//            }
//        }
//        return null;
//    }
//
//    // Helper method to scan QR code from image and return ticket ID
//    private String scanQRCodeFromImage(BufferedImage image) {
//        try {
//            LuminanceSource source = new BufferedImageLuminanceSource(image);
//            BinaryBitmap bitmap = new BinaryBitmap(new HybridBinarizer(source));
//            MultiFormatReader reader = new MultiFormatReader();
//
//            Result result = reader.decode(bitmap);
//            if (result != null) {
//                String decodedText = result.getText();
//                return extractTicketIdFromUrl(decodedText);
//            }
//        } catch (NotFoundException e) {
//            // Try with image preprocessing - increase contrast
//            BufferedImage enhancedImage = enhanceImageContrast(image);
//            try {
//                source = new BufferedImageLuminanceSource(enhancedImage);
//                bitmap = new BinaryBitmap(new HybridBinarizer(source));
//                MultiFormatReader reader2 = new MultiFormatReader();
//                Result result2 = reader2.decode(bitmap);
//                if (result2 != null) {
//                    String decodedText = result2.getText();
//                    return extractTicketIdFromUrl(decodedText);
//                }
//            } catch (NotFoundException ignored) {
//            }
//        } catch (Exception e) {
//            System.err.println("QR scan error: " + e.getMessage());
//        }
//        return null;
//    }
//
//    // Helper method to enhance image contrast for better QR detection
//    private BufferedImage enhanceImageContrast(BufferedImage image) {
//        BufferedImage result = new BufferedImage(image.getWidth(), image.getHeight(), image.getType());
//        for (int x = 0; x < image.getWidth(); x++) {
//            for (int y = 0; y < image.getHeight(); y++) {
//                int rgb = image.getRGB(x, y);
//                int r = (rgb >> 16) & 0xFF;
//                int g = (rgb >> 8) & 0xFF;
//                int b = rgb & 0xFF;
//
//                // Convert to grayscale and increase contrast
//                int gray = (int)(0.299 * r + 0.587 * g + 0.114 * b);
//                int enhanced = gray > 128 ? 255 : 0;
//                int newRgb = (enhanced << 16) | (enhanced << 8) | enhanced;
//                result.setRGB(x, y, newRgb);
//            }
//        }
//        return result;
//    }
//
//
//}
package com.cinema.supportservice.controller;

import com.cinema.supportservice.repository.TicketRepository;
import com.cinema.supportservice.model.Ticket;
import com.cinema.supportservice.model.enums.TicketStatus;
import com.cinema.supportservice.service.TicketQrPayloadService;
import io.minio.GetObjectArgs;
import io.minio.MinioClient;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.apache.pdfbox.rendering.ImageType;
import com.google.zxing.*;
import com.google.zxing.client.j2se.BufferedImageLuminanceSource;
import com.google.zxing.common.HybridBinarizer;
import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.awt.Graphics2D;
import java.awt.geom.AffineTransform;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;
import java.util.Optional;

@RestController
@RequestMapping({"", "/api"})
@RequiredArgsConstructor
public class SupportController {

    private final TicketRepository ticketRepository;
    private final MinioClient minioClient;
    private final TicketQrPayloadService ticketQrPayloadService;

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

    /**
     * Opaque validation token for the first ticket of a booking (e.g. customer PDF QR); value is stored in DB.
     */
    @GetMapping("/bookings/uuid/{bookingId}/tickets/primary-qr-payload")
    public ResponseEntity<Map<String, String>> getPrimaryQrPayload(@PathVariable UUID bookingId) {
        Long mappedBookingId = convertToLong(bookingId);
        List<Ticket> tickets = ticketRepository.findByBookingId(mappedBookingId);
        if (tickets.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Ticket t = tickets.get(0);
        String payload = ticketQrPayloadService.ensureValidationToken(t);
        return ResponseEntity.ok(Map.of("payload", payload));
    }

    private Long convertToLong(UUID uuid) {
        return Math.abs(uuid.getMostSignificantBits());
    }

    // Staff ticket validation
    @Transactional
    @PostMapping("/tickets/{ticketReference}/validate")
    public ResponseEntity<?> validateTicket(@PathVariable String ticketReference) {
        Optional<Ticket> resolvedTicket = findTicketByReference(ticketReference);
        if (resolvedTicket.isEmpty()) {
            return invalidTicketResponse();
        }

        Ticket ticket = resolvedTicket.get();
        if (!ticket.isActive()) {
            return ticketInactiveResponse();
        }

        if (ticket.getStatus() == TicketStatus.USED || ticket.isUsed()) {
            return ticketAlreadyUsedResponse(ticket);
        }

        TicketValidationResult validationResult = validateTicketUsageAtomically(ticket);
        if (validationResult.outcome() == TicketValidationOutcome.ALREADY_USED) {
            return ticketAlreadyUsedResponse(validationResult.ticket());
        }
        if (validationResult.outcome() == TicketValidationOutcome.INACTIVE) {
            return ticketInactiveResponse();
        }
        ticket = validationResult.ticket();

        return ResponseEntity.ok(Map.of(
                "status", "SUCCESS",
                "ticket", ticket,
                "message", "Ticket validated"
        ));
    }

    @Transactional
    @PostMapping("/tickets/validate")
    public ResponseEntity<?> validateTicketByQrValue(@RequestBody Map<String, String> payload) {
        String qrValue = payload.get("qrValue");
        if (qrValue == null || qrValue.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "status", "ERROR",
                    "message", "Invalid ticket"
            ));
        }

        TicketQrPayloadService.QrResolution resolution = ticketQrPayloadService.resolveQrValue(qrValue);
        if (!resolution.isSuccess()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "status", "ERROR",
                    "message", "Invalid ticket"
            ));
        }

        String ticketReference = resolution.validationToken() != null
                ? resolution.validationToken()
                : resolution.ticketId();

        Optional<Ticket> resolvedTicket = findTicketByReference(ticketReference);
        if (resolvedTicket.isEmpty()) {
            return invalidTicketResponse();
        }

        Ticket ticket = resolvedTicket.get();
        if (!ticket.isActive()) {
            return ticketInactiveResponse();
        }

        String status = "SUCCESS";
        String message = "Ticket validated";

        TicketValidationResult validationResult = validateTicketUsageAtomically(ticket);
        if (validationResult.outcome() == TicketValidationOutcome.SUCCESS) {
            ticket = validationResult.ticket();
        } else if (validationResult.outcome() == TicketValidationOutcome.ALREADY_USED) {
            ticket = validationResult.ticket();
            status = "FAILED";
            message = "Ticket already used";
        } else {
            ticket = validationResult.ticket();
            status = "ERROR";
            message = validationResult.outcome() == TicketValidationOutcome.INACTIVE
                    ? "Ticket inactive"
                    : "Ticket cannot be validated in its current state";
        }

        Map<String, Object> response = new HashMap<>();
        response.put("status", status);
        response.put("ticket", ticket);
        response.put("message", message);
        response.put("ticketId", ticket.getId().toString());
        response.put("validationToken", resolution.validationToken());
        response.put("qrSource", resolution.source().name());

        return ResponseEntity.ok(response);
    }

    // Get ticket details for validation (used by QR scanner)
    @GetMapping("/tickets/{ticketReference}/details")
    public ResponseEntity<?> getTicketDetails(@PathVariable String ticketReference) {
        Optional<Ticket> resolvedTicket = findTicketByReference(ticketReference);
        if (resolvedTicket.isEmpty()) {
            return invalidTicketResponse();
        }

        Ticket ticket = resolvedTicket.get();
        if (!ticket.isActive()) {
            return ticketInactiveResponse();
        }

        return ResponseEntity.ok(ticket);
    }

    @PostMapping("/tickets/verify-qr-value")
    public ResponseEntity<?> verifyQrValue(@RequestBody Map<String, String> payload) {
        try {
            String qrValue = payload.get("qrValue");
            if (qrValue == null || qrValue.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "No QR value provided"));
            }
            
            String ticketId = ticketQrPayloadService.resolveTicketId(qrValue);
            if (ticketId == null || !isValidUUID(ticketId)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid QR code format. This does not appear to be a valid ticket QR code."));
            }
            
            UUID ticketUUID = UUID.fromString(ticketId);
            Ticket ticket = ticketRepository.findById(ticketUUID).orElse(null);
            
            if (ticket == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Ticket not found. The QR code may be invalid."));
            }
            
            Map<String, String> response = new HashMap<>();
            response.put("ticketId", ticketId);
            response.put("status", ticket.getStatus().toString());
            response.put("message", "QR code decoded and matched successfully");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to verify QR code: " + e.getMessage()));
        }
    }

    @PostMapping("/tickets/scan-qr")
    public ResponseEntity<?> scanQRCodeFromImage(@RequestParam("qrImage") MultipartFile qrImage) {
        try {
            if (qrImage.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "No image file provided"));
            }

            String contentType = qrImage.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid file type. Please upload an image."));
            }

            if (qrImage.getSize() > 5 * 1024 * 1024) {
                return ResponseEntity.badRequest().body(Map.of("error", "File too large. Maximum size is 5MB."));
            }

            BufferedImage bufferedImage = ImageIO.read(qrImage.getInputStream());
            if (bufferedImage == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Could not read image file"));
            }

            String ticketId = scanQRCodeFromImage(bufferedImage);

            if (ticketId == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "No QR code found in the image. Please ensure the QR code is clearly visible."));
            }

            if (!isValidUUID(ticketId)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid QR code format. This does not appear to be a valid ticket QR code."));
            }

            UUID ticketUUID = UUID.fromString(ticketId);
            Ticket ticket = ticketRepository.findById(ticketUUID).orElse(null);

            if (ticket == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Ticket not found. The QR code may be invalid."));
            }

            Map<String, String> response = new HashMap<>();
            response.put("ticketId", ticketId);
            response.put("status", ticket.getStatus().toString());
            response.put("message", "QR code scanned successfully");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to scan QR code: " + e.getMessage()));
        }
    }

    @PostMapping("/tickets/scan-from-file")
    public ResponseEntity<?> scanTicketFromFile(@RequestParam("ticketFile") MultipartFile ticketFile) {
        try {
            List<String> diagnostics = new ArrayList<>();
            if (ticketFile.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "No file provided"));
            }

            String fileName = ticketFile.getOriginalFilename();
            String contentType = ticketFile.getContentType();
            diagnostics.add("fileName=" + fileName);
            diagnostics.add("contentType=" + contentType);
            diagnostics.add("size=" + ticketFile.getSize());
            BufferedImage imageToScan = null;

            // Handle PDF files
            if (fileName != null && fileName.toLowerCase().endsWith(".pdf")) {
                try {
                    // Create temporary file for PDF processing
                    java.io.File tempFile = java.io.File.createTempFile("ticket", ".pdf");
                    ticketFile.transferTo(tempFile);

                    // Load the PDF document
                    try (PDDocument document = PDDocument.load(tempFile)) {
                        PDFRenderer renderer = new PDFRenderer(document);
                        diagnostics.add("pdfPages=" + document.getNumberOfPages());
                        // Scan all pages because some ticket templates place QR on a non-first page.
                        for (int pageIndex = 0; pageIndex < document.getNumberOfPages(); pageIndex++) {
                            BufferedImage pdfPageImage = renderer.renderImageWithDPI(pageIndex, 300, ImageType.RGB);
                            String detectedTicketId = scanQRCodeFromImage(pdfPageImage);
                            if (detectedTicketId != null) {
                                imageToScan = pdfPageImage;
                                diagnostics.add("qrDetectedOnPage=" + (pageIndex + 1));
                                break;
                            }
                        }
                    } finally {
                        tempFile.delete();
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                    return ResponseEntity.badRequest().body(Map.of("error", "Failed to process PDF: " + e.getMessage()));
                }
            }
            // Handle image files
            else if (contentType != null && contentType.startsWith("image/")) {
                imageToScan = ImageIO.read(ticketFile.getInputStream());
                if (imageToScan == null) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Could not read image file"));
                }
                diagnostics.add("imageDimensions=" + imageToScan.getWidth() + "x" + imageToScan.getHeight());
            }
            else {
                return ResponseEntity.badRequest().body(Map.of("error", "Unsupported file type. Please upload PDF or image files."));
            }

            // Scan for QR code
            String ticketId = scanQRCodeFromImage(imageToScan);
            if (ticketId == null) {
                ticketId = extractTicketIdFromFileName(fileName);
                if (ticketId != null) {
                    diagnostics.add("ticketIdRecoveredFromFileName=true");
                }
            }

            if (ticketId == null) {
                return ResponseEntity.badRequest().body(Map.of(
                        "error", "No QR code found in the file. Please ensure the ticket contains a visible QR code.",
                        "diagnostics", diagnostics
                ));
            }

            if (!isValidUUID(ticketId)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid QR code format. This does not appear to be a valid ticket QR code."));
            }

            UUID ticketUUID = UUID.fromString(ticketId);
            Ticket ticket = ticketRepository.findById(ticketUUID).orElse(null);

            if (ticket == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Ticket not found. The QR code may be invalid."));
            }

            Map<String, String> response = new HashMap<>();
            response.put("ticketId", ticketId);
            response.put("status", ticket.getStatus().toString());
            response.put("message", "Ticket scanned successfully");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to scan ticket: " + e.getMessage()));
        }
    }

    // Helper method to scan QR code from image and return ticket ID
    private String scanQRCodeFromImage(BufferedImage image) {
        if (image == null) {
            return null;
        }

        // 1) Fast path: whole image + contrast enhanced.
        String result = decodeTicketId(image);
        if (result != null) {
            return result;
        }

        result = decodeTicketId(enhanceImageContrast(image));
        if (result != null) {
            return result;
        }

        // 2) Rotation attempts for tilted camera shots.
        int[] angles = new int[] {90, 180, 270};
        for (int angle : angles) {
            BufferedImage rotated = rotateImage(image, angle);
            result = decodeTicketId(rotated);
            if (result != null) {
                return result;
            }
            result = decodeTicketId(enhanceImageContrast(rotated));
            if (result != null) {
                return result;
            }
        }

        // 3) Region scanning for tickets where QR is a small part of the page.
        int width = image.getWidth();
        int height = image.getHeight();
        int cols = 4;
        int rows = 4;
        int tileW = Math.max(120, width / cols);
        int tileH = Math.max(120, height / rows);

        for (int c = 0; c < cols; c++) {
            for (int r = 0; r < rows; r++) {
                int x = Math.max(0, c * tileW - tileW / 6);
                int y = Math.max(0, r * tileH - tileH / 6);
                int w = Math.min(width - x, tileW + tileW / 3);
                int h = Math.min(height - y, tileH + tileH / 3);

                if (w < 120 || h < 120) {
                    continue;
                }

                BufferedImage tile = image.getSubimage(x, y, w, h);
                result = decodeTicketId(tile);
                if (result != null) {
                    return result;
                }

                result = decodeTicketId(enhanceImageContrast(tile));
                if (result != null) {
                    return result;
                }
            }
        }

        return null;
    }

    private String decodeTicketId(BufferedImage image) {
        try {
            LuminanceSource source = new BufferedImageLuminanceSource(image);
            BinaryBitmap bitmap = new BinaryBitmap(new HybridBinarizer(source));
            MultiFormatReader reader = new MultiFormatReader();
            Result decoded = reader.decode(bitmap);
            return decoded != null ? ticketQrPayloadService.resolveTicketId(decoded.getText()) : null;
        } catch (Exception ignored) {
            return null;
        }
    }

    private BufferedImage rotateImage(BufferedImage source, int angle) {
        try {
            double radians = Math.toRadians(angle);
            int w = source.getWidth();
            int h = source.getHeight();

            BufferedImage rotated = new BufferedImage(w, h, BufferedImage.TYPE_INT_RGB);
            Graphics2D g2d = rotated.createGraphics();
            AffineTransform at = new AffineTransform();
            at.rotate(radians, w / 2.0, h / 2.0);
            g2d.setTransform(at);
            g2d.drawImage(source, 0, 0, null);
            g2d.dispose();
            return rotated;
        } catch (Exception e) {
            return source;
        }
    }

    // Helper method to enhance image contrast for better QR detection
    private BufferedImage enhanceImageContrast(BufferedImage image) {
        BufferedImage result = new BufferedImage(image.getWidth(), image.getHeight(), BufferedImage.TYPE_BYTE_GRAY);
        for (int x = 0; x < image.getWidth(); x++) {
            for (int y = 0; y < image.getHeight(); y++) {
                int rgb = image.getRGB(x, y);
                int r = (rgb >> 16) & 0xFF;
                int g = (rgb >> 8) & 0xFF;
                int b = rgb & 0xFF;

                int gray = (int)(0.299 * r + 0.587 * g + 0.114 * b);
                int enhanced = gray > 128 ? 255 : 0;
                int newRgb = (enhanced << 16) | (enhanced << 8) | enhanced;
                result.setRGB(x, y, newRgb);
            }
        }
        return result;
    }

    private String extractTicketIdFromFileName(String fileName) {
        if (fileName == null || fileName.isBlank()) {
            return null;
        }

        java.util.regex.Matcher matcher = java.util.regex.Pattern.compile(
                "(?i)[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}"
        ).matcher(fileName);

        return matcher.find() ? matcher.group() : null;
    }

    // Helper method to validate UUID format
    private boolean isValidUUID(String uuidStr) {
        try {
            UUID.fromString(uuidStr);
            return true;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    private Optional<Ticket> findTicketByReference(String ticketReference) {
        if (ticketReference == null || ticketReference.trim().isEmpty()) {
            return Optional.empty();
        }

        String normalizedReference = ticketReference.trim();
        if (isValidUUID(normalizedReference)) {
            return ticketRepository.findById(UUID.fromString(normalizedReference));
        }

        return ticketRepository.findByValidationToken(normalizedReference);
    }

    private TicketValidationResult validateTicketUsageAtomically(Ticket ticket) {
        LocalDateTime now = LocalDateTime.now();
        int affectedRows = ticketRepository.markTicketUsedIfUnused(
                ticket.getId(),
                now,
                now,
                TicketStatus.USED
        );

        Ticket currentTicket = ticketRepository.findById(ticket.getId()).orElse(ticket);
        if (affectedRows == 1) {
            return new TicketValidationResult(currentTicket, TicketValidationOutcome.SUCCESS);
        }

        if (!currentTicket.isActive()) {
            return new TicketValidationResult(currentTicket, TicketValidationOutcome.INACTIVE);
        }

        if (currentTicket.isUsed() || currentTicket.getStatus() == TicketStatus.USED) {
            return new TicketValidationResult(currentTicket, TicketValidationOutcome.ALREADY_USED);
        }

        return new TicketValidationResult(currentTicket, TicketValidationOutcome.CANCELLED);
    }

    private ResponseEntity<Map<String, String>> invalidTicketResponse() {
        return ResponseEntity.badRequest().body(Map.of(
                "status", "ERROR",
                "message", "Invalid ticket"
        ));
    }

    private ResponseEntity<Map<String, String>> ticketInactiveResponse() {
        return ResponseEntity.badRequest().body(Map.of(
                "status", "ERROR",
                "message", "Ticket inactive"
        ));
    }

    private ResponseEntity<Map<String, Object>> ticketAlreadyUsedResponse(Ticket ticket) {
        return ResponseEntity.badRequest().body(Map.of(
                "status", "FAILED",
                "message", "Ticket already used",
                "ticket", ticket
        ));
    }

    private record TicketValidationResult(Ticket ticket, TicketValidationOutcome outcome) {}

    private enum TicketValidationOutcome {
        SUCCESS,
        ALREADY_USED,
        INACTIVE,
        CANCELLED
    }
}
