package com.cinema.paymentservice.dto;

import com.cinema.paymentservice.model.Payment;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
public class PaymentDto {
    private UUID id;
    private String stripeEventId;
    private String stripeSessionId;
    private UUID bookingId;
    private Long amount;
    private String currency;
    private Payment.PaymentStatus status;
    private String failureReason;
    private Instant createdAt;
}