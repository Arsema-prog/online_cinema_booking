package com.cinema.coreservice.service;

import com.cinema.coreservice.model.Movie;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ImdbService {

    private final RestTemplate restTemplate;

    @Value("${rapidapi.imdb.host}")
    private String rapidApiHost;

    @Value("${rapidapi.imdb.key}")
    private String rapidApiKey;

    public List<Movie> searchMovies(String query) {
        String url = "https://" + rapidApiHost + "/api/search?count=25&type=MOVIE&q=" + query;

        HttpHeaders headers = new HttpHeaders();
        headers.set("x-rapidapi-host", rapidApiHost);
        headers.set("x-rapidapi-key", rapidApiKey);
        headers.set("Content-Type", "application/json");

        HttpEntity<String> entity = new HttpEntity<>(headers);

        List<Movie> movies = new ArrayList<>();
        try {
            ResponseEntity<JsonNode> response = restTemplate.exchange(url, HttpMethod.GET, entity, JsonNode.class);
            JsonNode rootNode = response.getBody();

            if (rootNode != null && rootNode.has("data")) {
                JsonNode edgesNode = rootNode.path("data").path("mainSearch").path("edges");
                if (edgesNode.isArray()) {
                    for (JsonNode edge : edgesNode) {
                        JsonNode entityNode = edge.path("node").path("entity");
                        if (!entityNode.isMissingNode()) {
                            Movie movie = mapToMovie(entityNode);
                            if (movie != null) {
                                movies.add(movie);
                            }
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error fetching data from IMDb RapidAPI: {}", e.getMessage(), e);
        }

        return movies;
    }

    private Movie mapToMovie(JsonNode entityNode) {
        try {
            Movie movie = new Movie();
            
            JsonNode idNode = entityNode.path("id");
            if (!idNode.isMissingNode()) {
                movie.setImdbId(idNode.asText());
            }

            // Title
            JsonNode titleTextNode = entityNode.path("titleText").path("text");
            if (!titleTextNode.isMissingNode()) {
                movie.setTitle(titleTextNode.asText());
            }

            // Release Date
            JsonNode releaseDateNode = entityNode.path("releaseDate");
            if (!releaseDateNode.isMissingNode()) {
                int year = releaseDateNode.path("year").asInt(0);
                int month = releaseDateNode.path("month").asInt(1);
                int day = releaseDateNode.path("day").asInt(1);
                if (year > 0) {
                    movie.setReleaseDate(LocalDate.of(year, month > 0 ? month : 1, day > 0 ? day : 1));
                }
            } else {
                JsonNode releaseYearNode = entityNode.path("releaseYear").path("year");
                if (!releaseYearNode.isMissingNode()) {
                    int year = releaseYearNode.asInt(0);
                    if (year > 0) {
                        movie.setReleaseDate(LocalDate.of(year, 1, 1));
                    }
                }
            }

            // Poster URL
            JsonNode primaryImageNode = entityNode.path("primaryImage").path("url");
            if (!primaryImageNode.isMissingNode()) {
                movie.setPosterUrl(primaryImageNode.asText());
            }

            // Director/Cast (Principal Credits)
            JsonNode principalCreditsNode = entityNode.path("principalCredits");
            if (principalCreditsNode.isArray() && principalCreditsNode.size() > 0) {
                JsonNode creditsList = principalCreditsNode.get(0).path("credits");
                if (creditsList.isArray() && creditsList.size() > 0) {
                    List<String> names = new ArrayList<>();
                    for (JsonNode credit : creditsList) {
                        JsonNode nameNode = credit.path("name").path("nameText").path("text");
                        if (!nameNode.isMissingNode()) {
                            names.add(nameNode.asText());
                        }
                    }
                    if (!names.isEmpty()) {
                        movie.setDirector(String.join(", ", names)); 
                    }
                }
            }

            return movie;
        } catch (Exception e) {
            log.error("Failed to map JSON node to Movie", e);
            return null;
        }
    }

    public Movie getMovieDetails(String imdbId) {
        String url = "https://imdb236.p.rapidapi.com/api/imdb/" + imdbId;
        HttpHeaders headers = new HttpHeaders();
        headers.set("x-rapidapi-host", "imdb236.p.rapidapi.com");
        headers.set("x-rapidapi-key", rapidApiKey);
        headers.set("Content-Type", "application/json");

        HttpEntity<String> entity = new HttpEntity<>(headers);
        try {
            ResponseEntity<JsonNode> response = restTemplate.exchange(url, HttpMethod.GET, entity, JsonNode.class);
            JsonNode rootNode = response.getBody();
            if (rootNode != null) {
                Movie movie = new Movie();
                movie.setImdbId(imdbId);
                movie.setTitle(rootNode.path("primaryTitle").asText(null));
                movie.setDescription(rootNode.path("description").asText(null));
                movie.setPosterUrl(rootNode.path("primaryImage").asText(null));
                
                String releaseDateStr = rootNode.path("releaseDate").asText();
                if (releaseDateStr != null && !releaseDateStr.isEmpty() && !releaseDateStr.equals("null")) {
                    try {
                        movie.setReleaseDate(LocalDate.parse(releaseDateStr));
                    } catch (Exception e) {}
                }

                JsonNode genresNode = rootNode.path("genres");
                if (genresNode.isArray() && genresNode.size() > 0) {
                    List<String> genres = new ArrayList<>();
                    for (JsonNode g : genresNode) {
                        genres.add(g.asText());
                    }
                    movie.setGenre(String.join(", ", genres));
                }

                movie.setDuration(rootNode.path("runtimeMinutes").asInt(0));
                movie.setRating(rootNode.path("averageRating").asDouble(0.0));

                JsonNode directorsNode = rootNode.path("directors");
                if (directorsNode.isArray() && directorsNode.size() > 0) {
                    List<String> directors = new ArrayList<>();
                    for (JsonNode d : directorsNode) {
                        directors.add(d.path("fullName").asText());
                    }
                    movie.setDirector(String.join(", ", directors));
                }
                return movie;
            }
        } catch (Exception e) {
             log.error("Failed to fetch imdb details", e);
        }
        return null;
    }
}
