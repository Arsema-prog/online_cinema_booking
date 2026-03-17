package com.cinema.paymentservice.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "payments", schema = "payment")
@Data
@NoArgsConstructor
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(unique = true)
    private String stripeEventId;   // Stripe event id for idempotency

    @Column
    private String stripeSessionId;

    @Column(nullable = false)
    private UUID bookingId;

    @Column(nullable = false)
    private Long amount;            // in cents

    @Column(nullable = false)
    private String currency;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private PaymentStatus status;

    private String failureReason;

    @Column(nullable = false)
    private Instant createdAt;

    public enum PaymentStatus {
        PENDING, SUCCEEDED, FAILED
    }
}