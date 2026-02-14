package com.cinema.coreservice.controller;

import com.cinema.coreservice.model.Screen;
import com.cinema.coreservice.service.ScreenService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/screens")
@RequiredArgsConstructor
public class ScreenController {

    private final ScreenService screenService;

    @GetMapping
    public ResponseEntity<List<Screen>> getAllScreens() {
        return ResponseEntity.ok(screenService.getAllScreens());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Screen> getScreenById(@PathVariable Long id) {
        return ResponseEntity.ok(screenService.getScreenById(id));
    }

    @PostMapping
    public ResponseEntity<Screen> createScreen(@RequestBody Screen screen,
                                               @RequestParam int numberOfSeats) {
        return new ResponseEntity<>(screenService.createScreen(screen, numberOfSeats), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Screen> updateScreen(@PathVariable Long id,
                                               @RequestBody Screen updated) {
        return ResponseEntity.ok(screenService.updateScreen(id, updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteScreen(@PathVariable Long id) {
        screenService.deleteScreen(id);
        return ResponseEntity.noContent().build();
    }
}
