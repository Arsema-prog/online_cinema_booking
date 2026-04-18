package com.cinema.coreservice.dto;

import com.cinema.coreservice.model.Tag;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MovieResponse {
    
    private Long id;
    private String imdbId;
    private String title;
    private String description;
    private Integer duration;
    private String director;
    private LocalDate releaseDate;
    private Double rating;
    private Double basePrice;
    private Boolean isActive;
    private String posterUrl;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Using a list of tag models/dtos directly
    private List<Tag> tags;
}
