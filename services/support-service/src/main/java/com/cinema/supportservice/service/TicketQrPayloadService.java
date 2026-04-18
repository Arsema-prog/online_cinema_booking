package com.cinema.supportservice.service;

import com.cinema.supportservice.model.Ticket;
import com.cinema.supportservice.repository.TicketRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * QR content is an opaque validation token stored only in the database and linked to the ticket.
 * Scans resolve by DB lookup — values cannot be forged without knowing an existing token.
 */
@Service
public class TicketQrPayloadService {

    private static final int TOKEN_BYTES = 32;
    private static final Pattern TOKEN_PATTERN = Pattern.compile("^[A-Za-z0-9_-]{20,}$");

    private final TicketRepository ticketRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    public TicketQrPayloadService(TicketRepository ticketRepository) {
        this.ticketRepository = ticketRepository;
    }

    /**
     * Random token to assign before persisting the ticket; guaranteed unique with high probability.
     */
    public String newValidationToken() {
        for (int i = 0; i < 5; i++) {
            String candidate = randomUrlSafeToken();
            if (ticketRepository.findByValidationToken(candidate).isEmpty()) {
                return candidate;
            }
        }
        throw new IllegalStateException("Could not allocate a unique validation token");
    }

    @Transactional
    public String ensureValidationToken(Ticket ticket) {
        if (ticket.getValidationToken() != null && !ticket.getValidationToken().isBlank()) {
            return ticket.getValidationToken();
        }
        ticket.setValidationToken(newValidationToken());
        return ticketRepository.save(ticket).getValidationToken();
    }

    /**
     * Resolves scanned QR text to the ticket's public id (UUID string).
     * Prefers DB-backed validation token; falls back to legacy URL / bare UUID for older tickets.
     */
    public String resolveTicketId(String decodedText) {
        return resolveQrValue(decodedText).ticketId();
    }

    public QrResolution resolveQrValue(String decodedText) {
        if (decodedText == null) {
            return QrResolution.invalid("QR value is missing.");
        }

        String normalized = decodedText.trim();
        if (normalized.isEmpty()) {
            return QrResolution.invalid("QR value is empty.");
        }

        Optional<Ticket> byToken = ticketRepository.findByValidationToken(normalized);
        if (byToken.isPresent()) {
            Ticket ticket = byToken.get();
            return QrResolution.success(ticket.getId().toString(), normalized, Source.VALIDATION_TOKEN);
        }

        if (normalized.contains("ticketId=")) {
            String extractedTicketId = extractFromLegacyUrl(normalized);
            if (extractedTicketId == null) {
                return QrResolution.invalid("QR value contains a ticket link, but the ticketId is malformed.");
            }

            return QrResolution.success(extractedTicketId, null, Source.LEGACY_URL);
        }

        if (isValidUuidString(normalized)) {
            return QrResolution.success(normalized, null, Source.DIRECT_TICKET_ID);
        }

        if (TOKEN_PATTERN.matcher(normalized).matches()) {
            return QrResolution.tampered("QR validation token could not be verified. The code may be invalid or tampered.");
        }

        return QrResolution.invalid("QR value is not a recognized ticket QR format.");
    }

    private String randomUrlSafeToken() {
        byte[] buf = new byte[TOKEN_BYTES];
        secureRandom.nextBytes(buf);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(buf);
    }

    private static String extractFromLegacyUrl(String decodedText) {
        try {
            String[] parts = decodedText.split("ticketId=");
            if (parts.length <= 1) {
                return null;
            }
            String idPart = parts[1].trim();
            int ampIndex = idPart.indexOf('&');
            if (ampIndex != -1) {
                idPart = idPart.substring(0, ampIndex);
            }
            idPart = URLDecoder.decode(idPart, StandardCharsets.UTF_8).trim();
            return isValidUuidString(idPart) ? idPart : null;
        } catch (Exception e) {
            return null;
        }
    }

    private static boolean isValidUuidString(String uuidStr) {
        try {
            UUID.fromString(uuidStr);
            return true;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    public record QrResolution(
            String ticketId,
            String validationToken,
            Source source,
            Failure failure,
            String message
    ) {
        public boolean isSuccess() {
            return failure == null;
        }

        public static QrResolution success(String ticketId, String validationToken, Source source) {
            return new QrResolution(ticketId, validationToken, source, null, null);
        }

        public static QrResolution invalid(String message) {
            return new QrResolution(null, null, null, Failure.INVALID, message);
        }

        public static QrResolution tampered(String message) {
            return new QrResolution(null, null, null, Failure.TAMPERED, message);
        }
    }

    public enum Source {
        VALIDATION_TOKEN,
        LEGACY_URL,
        DIRECT_TICKET_ID
    }

    public enum Failure {
        INVALID,
        TAMPERED
    }
}
