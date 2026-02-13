package com.cinema.coreservice.controller;

import com.cinema.coreservice.model.Screen;
import com.cinema.coreservice.repository.ScreenRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/screens")
public class ScreenController {

    private final ScreenRepository screenRepository;

    public ScreenController(ScreenRepository screenRepository) {
        this.screenRepository = screenRepository;
    }

    @GetMapping
    public ResponseEntity<List<Screen>> getAll() {
        return ResponseEntity.ok(screenRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Screen> getById(@PathVariable Long id) {
        Screen screen = screenRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Screen not found: " + id));
        return ResponseEntity.ok(screen);
    }

    @PostMapping
    public ResponseEntity<Screen> create(@RequestBody Screen screen) {
        return new ResponseEntity<>(screenRepository.save(screen), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Screen> update(@PathVariable Long id,
                                         @RequestBody Screen updated) {
        Screen screen = screenRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Screen not found: " + id));

        screen.setName(updated.getName());
        screen.setCapacity(updated.getCapacity());
        screen.setBranch(updated.getBranch());

        return ResponseEntity.ok(screenRepository.save(screen));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!screenRepository.existsById(id)) {
            throw new EntityNotFoundException("Screen not found: " + id);
        }
        screenRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
