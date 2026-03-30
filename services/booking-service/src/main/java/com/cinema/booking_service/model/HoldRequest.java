package com.cinema.booking_service.model;

import lombok.*;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HoldRequest {

    private UUID userId;         // ID of the user making the booking
    private UUID showId;         // ID of the show
    private List<UUID> seatIds;  // Seats to hold
}
