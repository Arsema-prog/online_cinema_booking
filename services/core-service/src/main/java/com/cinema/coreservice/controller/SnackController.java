package com.cinema.coreservice.controller;

import com.cinema.coreservice.model.Snack;
import com.cinema.coreservice.service.SnackService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/snacks")
@RequiredArgsConstructor
public class SnackController {

    private final SnackService snackService;

    @GetMapping
    public ResponseEntity<List<Snack>> getAllSnacks() {
        return ResponseEntity.ok(snackService.getAllSnacks());
    }

    @GetMapping("/available")
    public ResponseEntity<List<Snack>> getAvailableSnacks() {
        return ResponseEntity.ok(snackService.getAvailableSnacks());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Snack> getSnackById(@PathVariable Long id) {
        return ResponseEntity.ok(snackService.getSnackById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'STAFF')")
    public ResponseEntity<Snack> createSnack(@RequestBody Snack snack) {
        Snack createdSnack = snackService.createSnack(snack);
        return new ResponseEntity<>(createdSnack, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'STAFF')")
    public ResponseEntity<Snack> updateSnack(@PathVariable Long id, @RequestBody Snack snack) {
        return ResponseEntity.ok(snackService.updateSnack(id, snack));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'STAFF')")
    public ResponseEntity<Void> deleteSnack(@PathVariable Long id) {
        snackService.deleteSnack(id);
        return ResponseEntity.noContent().build();
    }
}
