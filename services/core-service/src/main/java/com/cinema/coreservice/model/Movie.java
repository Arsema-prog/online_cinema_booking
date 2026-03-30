package com.cinema.coreservice.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "movie")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
//@Builder
public class Movie {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    private String genre;

    private Integer duration; // duration in minutes

    @Column(columnDefinition = "TEXT")
    private String description;

    private String director;

    @Column(name = "release_date")
    private LocalDate releaseDate;

    private BigDecimal rating;

    @Column(name = "poster_url", length = 1000)
    private String posterUrl;

    @Column(name = "base_price", precision = 10, scale = 2)
    private BigDecimal basePrice;

    @Column(name = "is_active")
    private Boolean isActive;

    @JsonIgnore
    @OneToMany(mappedBy = "movie", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Screening> screenings;
}
