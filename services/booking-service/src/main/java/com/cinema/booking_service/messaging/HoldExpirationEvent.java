package com.cinema.booking_service.messaging;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class HoldExpirationEvent {
    private String eventId;
    private UUID bookingId;
    private UUID showId;
    private UUID userId;
    private LocalDateTime expiresAt;
    private LocalDateTime occurredAt;
}
