// booking-service: com/cinema.booking_service.event.SeatStatusEvent
package com.cinema.booking_service.event;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SeatStatusEvent {
    private String eventType;        // SEAT_HELD, SEAT_RESERVED, SEAT_CANCELLED
    private UUID showId;              // Maps to screeningId
    private List<Long> seatIds;       // Numeric seat IDs from core service
    private UUID bookingId;
    private String userId;
    private LocalDateTime timestamp;
}