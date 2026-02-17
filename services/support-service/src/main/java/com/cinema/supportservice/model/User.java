package com.cinema.supportservice.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "users", schema = "support")
@Data
@NoArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String keycloakId;

    @Column(nullable = false, unique = true)
    private String username;

    private String email;
    private String firstName;
    private String lastName;

    @Column(nullable = false)
    private Boolean enabled;

    private Instant createdTimestamp;
}