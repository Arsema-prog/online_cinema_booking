package com.cinema.coreservice.controller;

import com.cinema.coreservice.model.Screening;
import com.cinema.coreservice.repository.ScreeningRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/screenings")
@RequiredArgsConstructor
public class ScreeningController {

    private final ScreeningRepository screeningRepository;

    @GetMapping
    public List<Screening> getAll() {
        return screeningRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Screening> getById(@PathVariable Long id) {
        return screeningRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'STAFF')")
    public Screening create(@RequestBody Screening screening) {
        return screeningRepository.save(screening);
    }
    @GetMapping("/debug")
    public List<Long> getAllIds() {
        return screeningRepository.findAll().stream()
                .map(Screening::getId)
                .collect(Collectors.toList());
    }
}