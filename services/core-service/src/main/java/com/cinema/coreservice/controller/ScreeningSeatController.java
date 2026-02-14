package com.cinema.coreservice.controller;

import com.cinema.coreservice.model.ScreeningSeat;
import com.cinema.coreservice.repository.ScreeningSeatRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/screening-seats")
@RequiredArgsConstructor
public class ScreeningSeatController {

    private final ScreeningSeatRepository screeningSeatRepository;

    @GetMapping("/{screeningId}")
    public List<ScreeningSeat> getSeatsForScreening(@PathVariable Long screeningId) {
        return screeningSeatRepository.findByScreeningId(screeningId);
    }
}
