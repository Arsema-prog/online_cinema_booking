package com.cinema.booking_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingDTO {
    private UUID id;
    private UUID userId;
    private UUID showId;
    private String status;
    private String movieTitle;
    private String branchName;
    private String screenName;
    private LocalDateTime showTime;
    private BigDecimal totalAmount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Integer seatCount; // Optional: number of seats booked
}