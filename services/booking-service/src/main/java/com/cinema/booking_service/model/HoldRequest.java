package com.cinema.booking_service.model;

import lombok.*;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HoldRequest {

    @NotNull
    private UUID userId;         // ID of the user making the booking
    @NotNull
    private UUID showId;         // ID of the show
    @NotEmpty
    private List<UUID> seatIds;  // Seats to hold
}
