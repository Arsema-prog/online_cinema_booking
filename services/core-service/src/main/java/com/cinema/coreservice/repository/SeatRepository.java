package com.cinema.coreservice.repository;

import com.cinema.coreservice.model.Seat;
import com.cinema.coreservice.model.Screen;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SeatRepository extends JpaRepository<Seat, Long> {

    // Fetch all seats for a given screen
    List<Seat> findByScreen(Screen screen);
}
