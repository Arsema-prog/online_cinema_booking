package com.cinema.coreservice.model;

import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "screen")
public class Screen {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private Integer capacity;

    @ManyToOne
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch branch;

    @OneToMany(mappedBy = "screen", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Seat> seats;

    @OneToMany(mappedBy = "screen", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Show> shows;

    // Constructors
    public Screen() {}

    // Getters and setters
    public Long getId() { return id; }
    public Integer getCapacity() { return capacity; }
    public void  setCapacity(Integer capacity) { this.capacity= capacity; }

    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Branch getBranch() { return branch; }
    public void setBranch(Branch branch) { this.branch = branch; }
    public List<Seat> getSeats() { return seats; }
    public void setSeats(List<Seat> seats) { this.seats = seats; }
    public List<Show> getShows() { return shows; }
    public void setShows(List<Show> shows) { this.shows = shows; }
}
