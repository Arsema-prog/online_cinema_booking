package com.cinema.supportservice.dto;

import lombok.Data;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

@Data
public class PriceEvaluationRequest {
    private Long showId;
    private String seatCategory;
    @NotNull
    @Min(1)
    private Integer seatCount;
    @NotNull
    @Min(1)
    private Long basePrice;        // initial price in cents per seat or total price
    private LocalDateTime showTime;
    private LocalDateTime bookingTime;
    private Long customerId;
    private String promoCode;
    @NotBlank
    private String currency;

    // To be set by rules
    private Long finalPrice;
}