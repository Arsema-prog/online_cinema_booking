package com.cinema.coreservice.service;

import com.cinema.coreservice.model.Movie;
import com.cinema.coreservice.repository.MovieRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import jakarta.persistence.EntityNotFoundException;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MovieService {

    private final MovieRepository movieRepository;
    private final MinioService minioService;

    public List<Movie> getAllMovies() {
        return movieRepository.findAll();
    }

    public List<Movie> getTrendingMovies() {
        return movieRepository.findTop5ByOrderByIdDesc();
    }

    public Movie getMovieById(Long id) {
        return movieRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Movie not found: " + id));
    }

    public Movie createMovie(Movie movie) {
        if (movie.getPosterUrl() != null && !movie.getPosterUrl().isEmpty() && movie.getPosterUrl().startsWith("http")) {
            String url = minioService.fetchAndUploadImage(movie.getPosterUrl());
            movie.setPosterUrl(url);
        }
        return movieRepository.save(movie);
    }

    public Movie updateMovie(Long id, Movie updated) {
        Movie movie = getMovieById(id);
        movie.setTitle(updated.getTitle());
        movie.setGenre(updated.getGenre());
        movie.setDuration(updated.getDuration());
        
        if (updated.getPosterUrl() != null && !updated.getPosterUrl().equals(movie.getPosterUrl())) {
            String url = minioService.fetchAndUploadImage(updated.getPosterUrl());
            movie.setPosterUrl(url);
        }
        
        return movieRepository.save(movie);
    }

    public void deleteMovie(Long id) {
        if (!movieRepository.existsById(id)) {
            throw new EntityNotFoundException("Movie not found: " + id);
        }
        movieRepository.deleteById(id);
    }
}
