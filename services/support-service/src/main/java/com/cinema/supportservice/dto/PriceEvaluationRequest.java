package com.cinema.supportservice.dto;

import lombok.Data;

@Data
public class PriceEvaluationRequest {
    private Long showId;
    private String seatCategory;
    private Long basePrice;        // initial price in cents
    private Long customerId;
    private String promoCode;
    private String currency;

    // To be set by rules
    private Long finalPrice;
}