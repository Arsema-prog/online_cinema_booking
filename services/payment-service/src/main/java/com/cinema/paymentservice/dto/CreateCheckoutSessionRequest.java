package com.cinema.paymentservice.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class CreateCheckoutSessionRequest {
    @NotNull
    private UUID bookingId;
    @NotNull @Min(1)
    private Long amount;        // in cents
    @NotBlank
    private String currency;
    @NotBlank
    private String successUrl;
    @NotBlank
    private String cancelUrl;
}