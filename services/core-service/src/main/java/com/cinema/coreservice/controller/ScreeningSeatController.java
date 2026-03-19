package com.cinema.coreservice.controller;

import com.cinema.coreservice.model.ScreeningSeat;
import com.cinema.coreservice.service.ScreeningSeatService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/screening-seats")
@RequiredArgsConstructor
public class ScreeningSeatController {

    private final ScreeningSeatService screeningSeatService;

    @GetMapping("/screening/{screeningId}")
    public List<ScreeningSeat> getSeatsByScreening(@PathVariable Long screeningId) {
        return screeningSeatService.getSeatsByScreeningId(screeningId);
    }

}