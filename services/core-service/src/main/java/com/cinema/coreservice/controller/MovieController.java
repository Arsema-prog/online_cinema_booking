package com.cinema.coreservice.controller;

import com.cinema.coreservice.dto.MovieRequest;
import com.cinema.coreservice.dto.MovieResponse;
import com.cinema.coreservice.model.Movie;
import com.cinema.coreservice.service.ImdbService;
import com.cinema.coreservice.service.MovieService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.cinema.coreservice.service.MinioService;
import java.util.List;
import java.util.ArrayList;
import java.net.URI;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;

@RestController
@RequestMapping("/movies")
@RequiredArgsConstructor
@Slf4j
public class MovieController {

    private final MovieService movieService;
    private final MinioService minioService;
    private final ObjectMapper objectMapper;
    private final ImdbService imdbService;

    @GetMapping
    public ResponseEntity<List<MovieResponse>> getAllMovies(
            @RequestParam(required = false) Long tagId) {
        return ResponseEntity.ok(movieService.getAllMovies(tagId).stream().map(this::toResponseMovie).toList());
    }

    @GetMapping("/trending")
    public ResponseEntity<List<MovieResponse>> getTrendingMovies() {
        return ResponseEntity.ok(movieService.getTrendingMovies().stream().map(this::toResponseMovie).toList());
    }

    @GetMapping("/search")
    public ResponseEntity<List<Movie>> searchExternalMovies(@RequestParam String q) {
        return ResponseEntity.ok(imdbService.searchMovies(q));
    }

    @GetMapping("/search/details")
    public ResponseEntity<Movie> searchExternalMovieDetails(@RequestParam String id) {
        return ResponseEntity.ok(imdbService.getMovieDetails(id));
    }

    @GetMapping("/{id}")
    public ResponseEntity<MovieResponse> getMovieById(@PathVariable Long id) {
        return ResponseEntity.ok(toResponseMovie(movieService.getMovieById(id)));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'STAFF')")
    public ResponseEntity<MovieResponse> createMovie(
            @RequestPart("movie") String movieStr,
            @RequestPart(value = "poster", required = false) MultipartFile poster) {
        try {
            log.info("createMovie request received. posterPresent={}, posterName={}, posterSize={}",
                    poster != null && !poster.isEmpty(),
                    poster != null ? poster.getOriginalFilename() : null,
                    poster != null ? poster.getSize() : null);
            MovieRequest movieRequest = objectMapper.readValue(movieStr, MovieRequest.class);
            Movie createdMovie = movieService.createMovie(movieRequest, poster);
            log.info("createMovie completed. movieId={}, posterUrl={}", createdMovie.getId(), createdMovie.getPosterUrl());
            return new ResponseEntity<>(toResponseMovie(createdMovie), HttpStatus.CREATED);
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse movie data or validate constraints", e);
        }
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'STAFF')")
    public ResponseEntity<MovieResponse> updateMovie(
            @PathVariable Long id, 
            @RequestPart("movie") String movieStr,
            @RequestPart(value = "poster", required = false) MultipartFile poster) {
        try {
            log.info("updateMovie request received. movieId={}, posterPresent={}, posterName={}, posterSize={}",
                    id,
                    poster != null && !poster.isEmpty(),
                    poster != null ? poster.getOriginalFilename() : null,
                    poster != null ? poster.getSize() : null);
            MovieRequest movieRequest = objectMapper.readValue(movieStr, MovieRequest.class);
            Movie savedMovie = movieService.updateMovie(id, movieRequest, poster);
            log.info("updateMovie completed. movieId={}, posterUrl={}", savedMovie.getId(), savedMovie.getPosterUrl());
            return ResponseEntity.ok(toResponseMovie(savedMovie));
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse movie data or validate constraints", e);
        }
    }

    @GetMapping("/{id}/poster")
    public ResponseEntity<Void> getMoviePoster(@PathVariable Long id) {
        Movie movie = movieService.getMovieById(id);
        if (movie.getPosterUrl() != null && !movie.getPosterUrl().isEmpty()) {
            if (movie.getPosterUrl().startsWith("http://") || movie.getPosterUrl().startsWith("https://")) {
                return ResponseEntity.status(HttpStatus.FOUND)
                        .location(URI.create(movie.getPosterUrl().trim()))
                        .build();
            }
            String normalizedPosterReference = minioService.normalizePosterReference(movie.getPosterUrl());
            if (normalizedPosterReference != null && minioService.isManagedPosterReference(movie.getPosterUrl())) {
                String signedUrl = minioService.getSignedUrl(normalizedPosterReference, 7);
                if (signedUrl != null && !signedUrl.isBlank()) {
                    return ResponseEntity.status(HttpStatus.FOUND)
                            .location(URI.create(signedUrl))
                            .build();
                }
            }
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'STAFF')")
    public ResponseEntity<Void> deleteMovie(@PathVariable Long id) {
        movieService.deleteMovie(id);
        return ResponseEntity.noContent().build();
    }

    private MovieResponse toResponseMovie(Movie source) {
        if (source == null) {
            return null;
        }

        MovieResponse response = new MovieResponse();
        response.setId(source.getId());
        response.setImdbId(source.getImdbId());
        response.setTitle(source.getTitle());
        response.setDuration(source.getDuration());
        response.setDescription(source.getDescription());
        response.setDirector(source.getDirector());
        response.setReleaseDate(source.getReleaseDate());
        response.setRating(source.getRating());
        response.setPosterUrl(minioService.toPublicObjectUrl(source.getPosterUrl()));
        response.setBasePrice(source.getBasePrice());
        response.setIsActive(source.getIsActive());
        response.setCreatedAt(source.getCreatedAt());
        response.setUpdatedAt(source.getUpdatedAt());
        if (source.getTags() != null) {
            response.setTags(new ArrayList<>(source.getTags()));
        } else {
            response.setTags(new ArrayList<>());
        }
        return response;
    }
}
