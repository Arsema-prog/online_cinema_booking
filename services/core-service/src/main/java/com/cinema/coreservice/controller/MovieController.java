package com.cinema.coreservice.controller;

import com.cinema.coreservice.model.Movie;
import com.cinema.coreservice.service.MovieService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import org.springframework.web.multipart.MultipartFile;

import com.cinema.coreservice.service.MinioService;
import java.util.List;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import java.io.InputStream;
import com.fasterxml.jackson.databind.ObjectMapper;
@RestController
@RequestMapping("/movies")
@RequiredArgsConstructor
public class MovieController {

    private final MovieService movieService;
    private final MinioService minioService;
    private final ObjectMapper objectMapper;

    @GetMapping
    public ResponseEntity<List<Movie>> getAllMovies() {
        return ResponseEntity.ok(movieService.getAllMovies());
    }

    @GetMapping("/trending")
    public ResponseEntity<List<Movie>> getTrendingMovies() {
        return ResponseEntity.ok(movieService.getTrendingMovies());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Movie> getMovieById(@PathVariable Long id) {
        return ResponseEntity.ok(movieService.getMovieById(id));
    }

    @PostMapping(consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'STAFF')")
    public ResponseEntity<Movie> createMovie(
            @RequestPart("movie") String movieStr,
            @RequestPart(value = "poster", required = false) MultipartFile poster) {
        try {
            Movie movie = objectMapper.readValue(movieStr, Movie.class);
            Movie createdMovie = movieService.createMovie(movie, poster);
            return new ResponseEntity<>(createdMovie, HttpStatus.CREATED);
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse movie data", e);
        }
    }

    @PutMapping(value = "/{id}", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'STAFF')")
    public ResponseEntity<Movie> updateMovie(
            @PathVariable Long id, 
            @RequestPart("movie") String movieStr,
            @RequestPart(value = "poster", required = false) MultipartFile poster) {
        try {
            Movie updated = objectMapper.readValue(movieStr, Movie.class);
            return ResponseEntity.ok(movieService.updateMovie(id, updated, poster));
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse movie data", e);
        }
    }

    @GetMapping("/{id}/poster")
    public ResponseEntity<Resource> getMoviePoster(@PathVariable Long id) {
        try {
            InputStream stream = minioService.getMoviePoster(id);
            if (stream == null) {
                return ResponseEntity.notFound().build();
            }
            InputStreamResource resource = new InputStreamResource(stream);
            return ResponseEntity.ok()
                    .contentType(MediaType.IMAGE_JPEG)
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'STAFF')")
    public ResponseEntity<Void> deleteMovie(@PathVariable Long id) {
        movieService.deleteMovie(id);
        return ResponseEntity.noContent().build();
    }
}
