package com.cinema.coreservice.service;

import com.cinema.coreservice.model.Movie;
import com.cinema.coreservice.repository.MovieRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import jakarta.persistence.EntityNotFoundException;
import org.springframework.web.multipart.MultipartFile;
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

    public Movie createMovie(Movie movie, MultipartFile poster) {
        Movie savedMovie = movieRepository.save(movie);
        if (poster != null && !poster.isEmpty()) {
            minioService.uploadMoviePoster(savedMovie.getId(), poster);
        }
        return savedMovie;
    }

    public Movie updateMovie(Long id, Movie updated, MultipartFile poster) {
        Movie movie = getMovieById(id);
        movie.setTitle(updated.getTitle());
        movie.setGenre(updated.getGenre());
        movie.setDuration(updated.getDuration());
        movie.setDescription(updated.getDescription());
        movie.setDirector(updated.getDirector());
        movie.setReleaseDate(updated.getReleaseDate());
        movie.setRating(updated.getRating());
        movie.setBasePrice(updated.getBasePrice());
        movie.setIsActive(updated.getIsActive() != null ? updated.getIsActive() : true);
        
        Movie savedMovie = movieRepository.save(movie);
        if (poster != null && !poster.isEmpty()) {
            minioService.uploadMoviePoster(savedMovie.getId(), poster);
        }
        return savedMovie;
    }

    public void deleteMovie(Long id) {
        if (!movieRepository.existsById(id)) {
            throw new EntityNotFoundException("Movie not found: " + id);
        }
        movieRepository.deleteById(id);
    }
}
