package com.cinema.supportservice.repository;

import com.cinema.supportservice.model.RuleSet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface RuleSetRepository extends JpaRepository<RuleSet, Long> {
    Optional<RuleSet> findByActiveTrue();
    Optional<RuleSet> findByVersion(String version);
}