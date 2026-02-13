package com.cinema.coreservice.controller;

import com.cinema.coreservice.model.Show;
import com.cinema.coreservice.repository.ShowRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/shows")
public class ShowController {

    private final ShowRepository showRepository;

    public ShowController(ShowRepository showRepository) {
        this.showRepository = showRepository;
    }

    @GetMapping
    public ResponseEntity<List<Show>> getAll() {
        return ResponseEntity.ok(showRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Show> getById(@PathVariable Long id) {
        Show show = showRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Show not found: " + id));
        return ResponseEntity.ok(show);
    }

    @PostMapping
    public ResponseEntity<Show> create(@RequestBody Show show) {
        return new ResponseEntity<>(showRepository.save(show), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Show> update(@PathVariable Long id,
                                       @RequestBody Show updated) {
        Show show = showRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Show not found: " + id));

        show.setMovie(updated.getMovie());
        show.setScreen(updated.getScreen());
        show.setStartTime(updated.getStartTime());
        show.setEndTime(updated.getEndTime());
        show.setPrice(updated.getPrice());

        return ResponseEntity.ok(showRepository.save(show));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!showRepository.existsById(id)) {
            throw new EntityNotFoundException("Show not found: " + id);
        }
        showRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
