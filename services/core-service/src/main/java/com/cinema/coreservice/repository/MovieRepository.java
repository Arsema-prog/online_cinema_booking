package com.cinema.coreservice.repository;

import com.cinema.coreservice.model.Movie;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MovieRepository extends JpaRepository<Movie, Long> {
    List<Movie> findTop5ByOrderByIdDesc();
    List<Movie> findByTagsId(Long tagId);
}
