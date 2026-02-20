package com.cinema.booking_service.repository;

import com.cinema.booking_service.domain.SeatHold;
import com.cinema.booking_service.domain.enums.SeatHoldStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface SeatHoldRepository extends JpaRepository<SeatHold, UUID> {

    // Find active holds for a show
    List<SeatHold> findByShowIdAndStatus(UUID showId, SeatHoldStatus status);

    // Find holds by user
    List<SeatHold> findByUserIdAndStatus(UUID userId, SeatHoldStatus status);

    // Find specific seat hold
    List<SeatHold> findByShowIdAndSeatIdAndStatus(UUID showId, UUID seatId, SeatHoldStatus status);

    List<SeatHold> findByBookingIdAndStatus(UUID bookingId, SeatHoldStatus seatHoldStatus);

    List<SeatHold> findByStatusAndExpiresAtBefore(
            SeatHoldStatus status,
            LocalDateTime time);

    void deleteByBookingId(UUID bookingId);
}
