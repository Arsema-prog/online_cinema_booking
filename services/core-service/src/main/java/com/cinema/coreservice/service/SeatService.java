package com.cinema.coreservice.service;

import com.cinema.coreservice.model.Seat;
import com.cinema.coreservice.repository.SeatRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SeatService {

    private final SeatRepository seatRepository;

    public List<Seat> getAllSeats() {
        return seatRepository.findAll();
    }

    public Seat getSeatById(Long id) {
        return seatRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Seat not found: " + id));
    }

    public List<Seat> getSeatsByScreenId(Long screenId) {
        return seatRepository.findByScreenId(screenId);
    }
}
