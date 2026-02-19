package com.cinema.booking_service.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "seat_hold", schema = "booking")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingSeat {

    @Id
    private UUID id;

    private UUID bookingId;
    private UUID seatId;

    private String status; // HELD / BOOKED / RELEASED
}

