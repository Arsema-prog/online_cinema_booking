package com.cinema.coreservice.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "snacks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Snack {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String description;

    @Enumerated(EnumType.STRING)
    private SnackCategory category;

    @Column(nullable = false)
    private BigDecimal price;

    private Integer stockQuantity;

    private boolean available = true;

    private String imageUrl;

    public enum SnackCategory {
        SNACK, DRINK, COMBO, POPCORN, CANDY
    }
}
