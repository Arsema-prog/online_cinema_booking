package com.cinema.coreservice.repository;

import com.cinema.coreservice.model.Screening;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ScreeningRepository extends JpaRepository<Screening, Long> {
}
