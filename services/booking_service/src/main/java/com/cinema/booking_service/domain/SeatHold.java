package com.cinema.booking_service.model;

import com.cinema.booking_service.model.enums.SeatHoldStatus;
import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "seat_hold", schema = "booking")
public class SeatHold {

    @Id
    private UUID id;

    private UUID showId;
    private UUID seatId;
    private UUID userId;

    private LocalDateTime expiresAt;

    @Enumerated(EnumType.STRING)
    private SeatHoldStatus status;
}
