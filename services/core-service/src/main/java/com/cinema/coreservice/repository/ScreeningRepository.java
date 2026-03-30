package com.cinema.coreservice.repository;

import com.cinema.coreservice.model.Screening;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface ScreeningRepository extends JpaRepository<Screening, Long> {

    @Query("SELECT s FROM Screening s WHERE s.movie.id = :movieId")
    List<Screening> findByMovieId(@Param("movieId") Long movieId);

    @Query("SELECT s FROM Screening s WHERE s.screen.id = :screenId AND " +
           "(s.startTime < :endTime AND s.endTime > :startTime)")
    List<Screening> findOverlappingScreenings(@Param("screenId") Long screenId, 
                                              @Param("startTime") LocalDateTime startTime, 
                                              @Param("endTime") LocalDateTime endTime);

    @Query("SELECT COUNT(s) FROM Screening s WHERE s.screen.branch.id = :branchId " +
           "AND s.movie.id = :movieId AND s.startTime >= :startOfDay AND s.startTime < :endOfDay")
    long countScreeningsForMovieInBranch(@Param("branchId") Long branchId,
                                         @Param("movieId") Long movieId,
                                         @Param("startOfDay") LocalDateTime startOfDay,
                                         @Param("endOfDay") LocalDateTime endOfDay);
}
