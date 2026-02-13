package com.cinema.coreservice.controller;

import com.cinema.coreservice.model.Seat;
import com.cinema.coreservice.repository.SeatRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/seats")
public class SeatController {

    private final SeatRepository seatRepository;

    public SeatController(SeatRepository seatRepository) {
        this.seatRepository = seatRepository;
    }

    @GetMapping
    public ResponseEntity<List<Seat>> getAll() {
        return ResponseEntity.ok(seatRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Seat> getById(@PathVariable Long id) {
        Seat seat = seatRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Seat not found: " + id));
        return ResponseEntity.ok(seat);
    }

    @PostMapping
    public ResponseEntity<Seat> create(@RequestBody Seat seat) {
        return new ResponseEntity<>(seatRepository.save(seat), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Seat> update(@PathVariable Long id,
                                       @RequestBody Seat updated) {
        Seat seat = seatRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Seat not found: " + id));

        seat.setSeatNumber(updated.getSeatNumber());
        seat.setRowNumber(updated.getRowNumber());
        seat.setScreen(updated.getScreen());
        seat.setStatus(updated.getStatus());

        return ResponseEntity.ok(seatRepository.save(seat));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!seatRepository.existsById(id)) {
            throw new EntityNotFoundException("Seat not found: " + id);
        }
        seatRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
