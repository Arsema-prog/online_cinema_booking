package com.cinema.booking_service.model;

import com.cinema.booking_service.domain.enums.BookingStatus;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HoldResponse {

    private UUID bookingId;
    private BookingStatus status;
    private List<UUID> heldSeatIds;
    private LocalDateTime expiresAt;  // when the hold will expire
}
