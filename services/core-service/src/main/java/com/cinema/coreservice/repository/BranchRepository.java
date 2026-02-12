package com.cinema.coreservice.repository;

import com.cinema.coreservice.model.Branch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BranchRepository extends JpaRepository<Branch, Long> {
    // You can add custom queries here later if needed
}
