package com.cinema.coreservice.controller;

import com.cinema.coreservice.service.ScreeningSeatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final ScreeningSeatService screeningSeatService;

    @PostMapping("/recalculate-available-seats")
    public ResponseEntity<String> recalculateAvailableSeats() {
        screeningSeatService.recalculateAllScreeningAvailableSeats();
        return ResponseEntity.ok("Available seats recalculated for all screenings");
    }
}