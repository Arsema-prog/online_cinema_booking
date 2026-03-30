package com.cinema.booking_service.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HoldResponse {
    private UUID bookingId;
    private String status;  // Change from BookingStatus to String
    private List<UUID> heldSeatIds;
    private LocalDateTime expiresAt;
    private Long expiresAtEpochMs;
}
