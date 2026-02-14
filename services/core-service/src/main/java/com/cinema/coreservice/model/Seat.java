package com.cinema.coreservice.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "seat")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Seat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String seatNumber;
    private String seatType;
    private Integer rowNumber;

    @ManyToOne
    @JoinColumn(name = "screen_id", nullable = false)
    private Screen screen;
}
