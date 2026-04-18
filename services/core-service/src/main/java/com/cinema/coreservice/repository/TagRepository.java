package com.cinema.coreservice.repository;

import com.cinema.coreservice.model.Tag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TagRepository extends JpaRepository<Tag, Long> {
    boolean existsByGenreIgnoreCase(String genre);
}
