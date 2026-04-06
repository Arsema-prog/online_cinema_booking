package com.cinema.coreservice.repository;

import com.cinema.coreservice.model.Snack;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SnackRepository extends JpaRepository<Snack, Long> {
    List<Snack> findByAvailableTrue();
    List<Snack> findByCategory(Snack.SnackCategory category);
}
