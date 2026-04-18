package com.cinema.coreservice.service;

import com.cinema.coreservice.dto.MovieRequest;
import com.cinema.coreservice.model.Movie;
import com.cinema.coreservice.model.Tag;
import com.cinema.coreservice.repository.MovieRepository;
import com.cinema.coreservice.repository.TagRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;
import java.util.HashSet;

@Service
@RequiredArgsConstructor
@Slf4j
public class MovieService {

    private final MovieRepository movieRepository;
    private final TagRepository tagRepository;
    private final MinioService minioService;

    @Value("${minio.endpoint:http://localhost:9000}")
    private String minioEndpoint;

    @Value("${minio.bucket:posters}")
    private String bucketName;

    public List<Movie> getAllMovies(Long tagId) {
        if (tagId != null) {
            return movieRepository.findByTagsId(tagId);
        }
        return movieRepository.findAll();
    }

    public List<Movie> getTrendingMovies() {
        return movieRepository.findTop5ByOrderByIdDesc();
    }

    public Movie getMovieById(Long id) {
        return movieRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Movie not found: " + id));
    }

    public Movie createMovie(MovieRequest request, MultipartFile poster) {
        validateTags(request.getTagIds());
        
        Movie movie = new Movie();
        mapRequestToMovie(request, movie);
        
        List<Tag> tags = tagRepository.findAllById(request.getTagIds());
        movie.setTags(new HashSet<>(tags));

        String requestedPosterReference = request.getPosterUrl();
        movie.setPosterUrl(null);
        
        Movie savedMovie = movieRepository.save(movie);
        log.info("Movie saved with ID: {}", savedMovie.getId());

        if (poster != null && !poster.isEmpty()) {
            try {
                String objectKey = minioService.uploadMoviePoster(savedMovie.getId(), poster);
                savedMovie.setPosterUrl(minioService.toPublicObjectUrl(objectKey));
                savedMovie = movieRepository.save(savedMovie);
                log.info("Saved movie {} with poster URL {}", savedMovie.getId(), savedMovie.getPosterUrl());
            } catch (Exception e) {
                log.error("Poster upload failed for movie {}: {}", savedMovie.getId(), e.getMessage(), e);
            }
        } else if (requestedPosterReference != null && !requestedPosterReference.isBlank()) {
            savedMovie.setPosterUrl(resolvePosterReference(requestedPosterReference, savedMovie.getId()));
            savedMovie = movieRepository.save(savedMovie);
            log.info("Saved movie {} with manual poster reference {}", savedMovie.getId(), savedMovie.getPosterUrl());
        }

        return savedMovie;
    }

    public Movie updateMovie(Long id, MovieRequest updated, MultipartFile poster) {
        validateTags(updated.getTagIds());
        
        Movie movie = getMovieById(id);
        mapRequestToMovie(updated, movie);
        
        List<Tag> tags = tagRepository.findAllById(updated.getTagIds());
        movie.setTags(new HashSet<>(tags));
        
        movie.setPosterUrl(resolvePosterReference(updated.getPosterUrl(), movie.getId()));

        Movie savedMovie = movieRepository.save(movie);
        log.info("Movie updated with ID: {}", savedMovie.getId());

        if (poster != null && !poster.isEmpty()) {
            try {
                log.info("Uploading new poster for movie ID: {}", savedMovie.getId());
                String objectKey = minioService.uploadMoviePoster(savedMovie.getId(), poster);
                savedMovie.setPosterUrl(minioService.toPublicObjectUrl(objectKey));
                savedMovie = movieRepository.save(savedMovie);
                log.info("Poster URL updated for movie {}: {}", savedMovie.getId(), savedMovie.getPosterUrl());

            } catch (Exception e) {
                log.error("Failed to upload poster for movie {}: {}", savedMovie.getId(), e.getMessage(), e);
            }
        }

        return savedMovie;
    }

    public void deleteMovie(Long id) {
        if (!movieRepository.existsById(id)) {
            throw new EntityNotFoundException("Movie not found: " + id);
        }
        movieRepository.deleteById(id);
    }
    
    private void validateTags(List<Long> tagIds) {
        if (tagIds == null || tagIds.isEmpty()) {
            throw new IllegalArgumentException("At least one tag is required");
        }
        long foundTags = tagRepository.findAllById(tagIds).size();
        if (foundTags != tagIds.size()) {
            throw new IllegalArgumentException("One or more invalid Tag IDs provided");
        }
    }
    
    private void mapRequestToMovie(MovieRequest request, Movie movie) {
        movie.setTitle(request.getTitle());
        movie.setDuration(request.getDuration());
        movie.setDescription(request.getDescription());
        movie.setDirector(request.getDirector());
        movie.setReleaseDate(request.getReleaseDate());
        movie.setRating(request.getRating());
        movie.setBasePrice(request.getBasePrice());
        movie.setIsActive(request.getIsActive() != null ? request.getIsActive() : true);
    }

    private String buildPosterUrl(String objectKey) {
        String normalizedEndpoint = minioEndpoint != null
                ? minioEndpoint.replaceAll("/+$", "")
                : "http://localhost:9000";
        return String.format("%s/%s/%s", normalizedEndpoint, bucketName, objectKey);
    }

    private String resolvePosterReference(String posterReference, Long movieId) {
        if (posterReference == null || posterReference.isBlank()) {
            return null;
        }

        String resolved = posterReference.trim()
                .replace("<id>", String.valueOf(movieId))
                .replace("{id}", String.valueOf(movieId));

        String normalized = minioService.normalizePosterReference(resolved);
        if (normalized == null || normalized.isBlank()) {
            return resolved;
        }
        return minioService.toPublicObjectUrl(normalized);
    }
}
