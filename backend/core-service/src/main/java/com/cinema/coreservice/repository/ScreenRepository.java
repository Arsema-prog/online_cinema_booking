package com.cinema.coreservice.repository;

import com.cinema.coreservice.model.Screen;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ScreenRepository extends JpaRepository<Screen, Long> {
    List<Screen> findByBranchId(Long branchId);  // Useful for getting screens per branch
}
