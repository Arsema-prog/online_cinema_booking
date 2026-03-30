package com.cinema.coreservice.repository;

import com.cinema.coreservice.model.ScreeningSeat;
import com.cinema.coreservice.model.enums.SeatStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ScreeningSeatRepository extends JpaRepository<ScreeningSeat, Long> {

    List<ScreeningSeat> findByScreeningId(Long screeningId);

    @Query("SELECT ss FROM ScreeningSeat ss JOIN FETCH ss.seat s " +
            "WHERE ss.screening.id = :screeningId " +
            "ORDER BY s.rowLabel, s.seatNumber")
    List<ScreeningSeat> findByScreeningIdOrderBySeatRowLabelSeatNumber(@Param("screeningId") Long screeningId);

    @Query("SELECT ss FROM ScreeningSeat ss WHERE ss.screening.id = :screeningId " +
            "AND ss.seat.id IN :seatIds")
    List<ScreeningSeat> findByScreeningIdAndSeatIdIn(
            @Param("screeningId") Long screeningId,
            @Param("seatIds") List<Long> seatIds);

    List<ScreeningSeat> findByScreeningIdAndStatus(Long screeningId, SeatStatus status);


    @Query("SELECT COUNT(ss) FROM ScreeningSeat ss WHERE ss.screening.id = :screeningId AND ss.status = :status")
    long countByScreeningIdAndStatus(@Param("screeningId") Long screeningId, @Param("status") SeatStatus status);
    Optional<ScreeningSeat> findByScreeningIdAndSeatId(Long screeningId, Long seatId);

    // Add this method
    long countByScreeningId(Long screeningId);
}