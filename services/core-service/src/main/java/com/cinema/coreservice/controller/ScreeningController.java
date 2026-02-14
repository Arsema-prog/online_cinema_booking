package com.cinema.coreservice.controller;

import com.cinema.coreservice.model.Screening;
import com.cinema.coreservice.repository.ScreeningRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/screenings")
@RequiredArgsConstructor
public class ScreeningController {

    private final ScreeningRepository screeningRepository;

    @GetMapping
    public List<Screening> getAll() {
        return screeningRepository.findAll();
    }

    @PostMapping
    public Screening create(@RequestBody Screening screening) {
        return screeningRepository.save(screening);
    }
}

