package com.cinema.booking_service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BookingConfirmedEvent {
    private UUID bookingId;      // Changed from Long to UUID
    private UUID userId;         // Changed from Long to UUID
    private String userEmail;
    private String movieTitle;
    private String branchName;
    private String screenName;
    private LocalDateTime showTime;
    private List<String> seats;
    private BigDecimal totalPrice;
}