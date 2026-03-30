package com.cinema.booking_service.repository;

import com.cinema.booking_service.domain.Booking;
import com.cinema.booking_service.domain.enums.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BookingRepository extends JpaRepository<Booking, UUID> {

    // Find all bookings for a user
    List<Booking> findByUserId(UUID userId);

    // Find bookings by show and status
    List<Booking> findByShowIdAndStatus(UUID showId, BookingStatus status);
}
