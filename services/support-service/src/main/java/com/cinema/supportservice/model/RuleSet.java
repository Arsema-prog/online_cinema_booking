package com.cinema.supportservice.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;

@Entity
@Table(name = "rule_sets", schema = "support")
@Data
@NoArgsConstructor
public class RuleSet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String version;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String drlContent;

    @Column(nullable = false)
    private Instant createdAt;

    private Instant activatedAt;

    @Column(nullable = false)
    private boolean active;
}