package com.cinema.coreservice.repository;

import com.cinema.coreservice.model.ScreeningSeat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import jakarta.persistence.LockModeType;
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

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT ss FROM ScreeningSeat ss JOIN FETCH ss.seat s WHERE ss.screening.id = :screeningId " +
            "AND ss.seat.id IN :seatIds")
    List<ScreeningSeat> findByScreeningIdAndSeatIdInForUpdate(
            @Param("screeningId") Long screeningId,
            @Param("seatIds") List<Long> seatIds);

    List<ScreeningSeat> findByScreeningIdAndIsBooked(Long screeningId, Boolean isBooked);

    long countByScreeningId(Long screeningId);

    @Query("SELECT COUNT(ss) FROM ScreeningSeat ss WHERE ss.screening.id = :screeningId AND ss.isBooked = :isBooked")
    long countByScreeningIdAndIsBooked(@Param("screeningId") Long screeningId, @Param("isBooked") Boolean isBooked);
}
