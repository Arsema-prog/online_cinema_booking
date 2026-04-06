package com.cinema.supportservice.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class PriceEvaluationRequest {
    private Long showId;
    private String seatCategory;
    private Integer seatCount;
    private Long basePrice;        // initial price in cents per seat or total price
    private LocalDateTime showTime;
    private LocalDateTime bookingTime;
    private Long customerId;
    private String promoCode;
    private String currency;

    // To be set by rules
    private Long finalPrice;
}