package com.cinema.booking_service.repository;

import com.cinema.booking_service.domain.Seat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SeatRepository extends JpaRepository<Seat, UUID> {
    List<Seat> findByShowId(UUID showId);
}
