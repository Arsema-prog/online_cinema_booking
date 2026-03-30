package com.cinema.booking_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserHistoryBookingDto {
    private UUID id;
    private UUID userId;
    private String movieTitle;
    private String cinemaName;
    private String screenNumber;
    private LocalDateTime showTime;
    private List<HistorySeatDto> seats;
    private Integer seatCount;
    private String snackDetails;
    private BigDecimal snacksTotal;
    private BigDecimal totalAmount;
    private String status;
    private LocalDateTime createdAt;
}
