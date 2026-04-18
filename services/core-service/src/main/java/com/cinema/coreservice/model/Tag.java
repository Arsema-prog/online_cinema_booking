package com.cinema.coreservice.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "tag")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Tag {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "release_date")
    private LocalDate releaseDate;

    private String genre;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @ManyToMany(mappedBy = "tags")
    private java.util.Set<Movie> movies = new java.util.HashSet<>();

}
