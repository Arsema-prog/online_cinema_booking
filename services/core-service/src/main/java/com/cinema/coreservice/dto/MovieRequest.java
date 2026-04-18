package com.cinema.coreservice.dto;

import java.time.LocalDate;
import java.util.List;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MovieRequest {
    
    @NotNull(message = "Title cannot be null")
    private String title;
    
    private String description;
    private Integer duration;
    private String director;
    private LocalDate releaseDate;
    private Double rating;
    private Double basePrice;
    private Boolean isActive;
    private String posterUrl;
    
    @NotNull(message = "tagIds cannot be null")
    @NotEmpty(message = "At least one tag is required")
    private List<Long> tagIds;
}
