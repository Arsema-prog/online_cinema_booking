package com.cinema.booking_service.model;

import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SeatAvailability {
    private UUID seatId;
    private String status; // AVAILABLE / HELD / BOOKED
}
