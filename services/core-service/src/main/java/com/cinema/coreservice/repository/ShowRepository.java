package com.cinema.coreservice.repository;

import com.cinema.coreservice.model.Show;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ShowRepository extends JpaRepository<Show, Long> {
    List<Show> findByScreenId(Long screenId);
    List<Show> findByStartTimeBetween(LocalDateTime start, LocalDateTime end);
}
