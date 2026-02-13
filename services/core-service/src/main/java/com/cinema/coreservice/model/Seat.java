package com.cinema.coreservice.model;

import jakarta.persistence.*;

@Entity
@Table(name = "seat")
public class Seat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String seatNumber;
    private String seatType; // e.g., REGULAR, PREMIUM, VIP
    private Integer rowNumber;  // ← ADD THIS

    private String status;
    @ManyToOne
    @JoinColumn(name = "screen_id", nullable = false)
    private Screen screen;

    // Constructors
    public Seat() {}

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getSeatNumber() { return seatNumber; }
    public void setSeatNumber(String seatNumber) { this.seatNumber = seatNumber; }
    public String getSeatType() { return seatType; }
    public void setSeatType(String seatType) { this.seatType = seatType; }
    public Screen getScreen() { return screen; }
    public void setScreen(Screen screen) { this.screen = screen; }

    public Integer getRowNumber() {
        return rowNumber;
    }

    public void setRowNumber(Integer rowNumber) {
        this.rowNumber = rowNumber;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
