package com.cinema.booking_service.model;

import com.cinema.booking_service.model.enums.BookingStatus;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "booking", schema = "booking")
public class Booking {

    @Id
    private UUID id;

    private UUID userId;
    private UUID showId;

    @Enumerated(EnumType.STRING)
    private BookingStatus status;

    private BigDecimal totalAmount;
    private String currency;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

}
