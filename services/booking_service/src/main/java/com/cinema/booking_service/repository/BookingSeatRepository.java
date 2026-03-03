package com.cinema.booking_service.repository;

import com.cinema.booking_service.domain.BookingSeat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BookingSeatRepository extends JpaRepository<BookingSeat, UUID> {

    // Find all seats for a specific booking
    List<BookingSeat> findByBookingId(UUID bookingId);

    // Find specific seat by seatId (optional, for availability checks)
    List<BookingSeat> findBySeatId(UUID seatId);

    // ✅ Find all booked seats for a specific show
    @Query("SELECT bs FROM BookingSeat bs JOIN Booking b ON bs.bookingId = b.id WHERE b.showId = :showId")
    List<BookingSeat> findByShowId(@Param("showId") UUID showId);

    void deleteByBookingId(UUID bookingId);
}
