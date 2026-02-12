package com.cinema.coreservice.repository;

import com.cinema.coreservice.model.Movie;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MovieRepository extends JpaRepository<Movie, Long> {
    // You can add custom queries later, e.g., filter by rating, duration, etc.
}
