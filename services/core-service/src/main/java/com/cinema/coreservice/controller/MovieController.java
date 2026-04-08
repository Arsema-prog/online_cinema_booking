package com.cinema.coreservice.controller;

import com.cinema.coreservice.model.Movie;
import com.cinema.coreservice.service.MovieService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.HttpHeaders;
import java.net.URI;
import com.cinema.coreservice.service.MinioService;
import java.util.List;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import java.io.InputStream;
@RestController
@RequestMapping("/movies")
@RequiredArgsConstructor
public class MovieController {

    private final MovieService movieService;
    private final MinioService minioService;

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
            @RequestPart("movie") Movie movie,
            @RequestPart(value = "poster", required = false) MultipartFile poster) {
        Movie createdMovie = movieService.createMovie(movie, poster);
        return new ResponseEntity<>(createdMovie, HttpStatus.CREATED);
    }

    @PutMapping(value = "/{id}", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'STAFF')")
    public ResponseEntity<Movie> updateMovie(
            @PathVariable Long id, 
            @RequestPart("movie") Movie updated,
            @RequestPart(value = "poster", required = false) MultipartFile poster) {
        return ResponseEntity.ok(movieService.updateMovie(id, updated, poster));
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
