package com.cinema.coreservice.model;

import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "movie")
public class Movie {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String genre;
    private int duration; // duration in minutes

    @OneToMany(mappedBy = "movie", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Show> shows;

    // Constructors
    public Movie() {}

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getGenre() { return genre; }
    public void setGenre(String genre) { this.genre = genre; }
    public int getDuration() { return duration; }
    public void setDuration(int duration) { this.duration = duration; }
    public List<Show> getShows() { return shows; }
    public void setShows(List<Show> shows) { this.shows = shows; }
}
