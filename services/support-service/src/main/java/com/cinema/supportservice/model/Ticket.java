package com.cinema.supportservice.model;

import com.cinema.supportservice.model.enums.TicketStatus;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.GenericGenerator;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
        name = "tickets",
        indexes = {
                @Index(name = "idx_ticket_booking", columnList = "booking_id"),
                @Index(name = "idx_ticket_user", columnList = "user_id"),
                @Index(name = "idx_ticket_status", columnList = "status")
        }
)
@Getter
@Setter
public class Ticket {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(
            name = "UUID",
            strategy = "org.hibernate.id.UUIDGenerator"
    )
    @Column(nullable = false, updatable = false)
    private UUID id;

    @Column(name = "ticket_number", nullable = false, unique = true)
    private String ticketNumber;

    @Column(name = "booking_id", nullable = false)
    private Long bookingId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "movie_title", nullable = false)
    private String movieTitle;

    @Column(name = "branch_name", nullable = false)
    private String branchName;

    @Column(name = "screen_name", nullable = false)
    private String screenName;

    @Column(name = "show_time", nullable = false)
    private LocalDateTime showTime;

    @Column(name = "seat_number", nullable = false)
    private String seatNumber;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    // Optional – for MinIO integration later
    @Column(name = "qr_code")
    private String qrObjectKey;

    @Column(name = "pdf_object_key")
    private String pdfObjectKey;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TicketStatus status;

    @Column(name = "issued_at", nullable = false)
    private LocalDateTime issuedAt;

    @Column(name = "validated_at")
    private LocalDateTime validatedAt;

    @Column(name = "is_active", nullable = false)
    @ColumnDefault("true")
    private boolean isActive = true;

    @Column(name = "is_used", nullable = false)
    @ColumnDefault("false")
    private boolean isUsed = false;

    @Column(name = "used_at")
    private LocalDateTime usedAt;

    /**
     * Opaque value encoded in the QR image; valid only if it matches this row in the database.
     */
    @JsonIgnore
    @Column(name = "validation_token", nullable = false, unique = true, length = 80)
    private String validationToken;

}