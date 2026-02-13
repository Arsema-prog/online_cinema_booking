package com.cinema.coreservice.controller;

import com.cinema.coreservice.model.Movie;
import com.cinema.coreservice.repository.MovieRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/movies")
public class MovieController {

    private final MovieRepository movieRepository;

    public MovieController(MovieRepository movieRepository) {
        this.movieRepository = movieRepository;
    }

    @GetMapping
    public ResponseEntity<List<Movie>> getAll() {
        return ResponseEntity.ok(movieRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Movie> getById(@PathVariable Long id) {
        Movie movie = movieRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Movie not found: " + id));
        return ResponseEntity.ok(movie);
    }

    @PostMapping
    public ResponseEntity<Movie> create(@RequestBody Movie movie) {
        return new ResponseEntity<>(movieRepository.save(movie), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Movie> update(@PathVariable Long id,
                                        @RequestBody Movie updated) {
        Movie movie = movieRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Movie not found: " + id));

        movie.setTitle(updated.getTitle());
        movie.setGenre(updated.getGenre());
        movie.setDuration(updated.getDuration());
       // movie.setDescription(updated.getDescription());

        return ResponseEntity.ok(movieRepository.save(movie));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!movieRepository.existsById(id)) {
            throw new EntityNotFoundException("Movie not found: " + id);
        }
        movieRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
