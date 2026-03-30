package com.cinema.booking_service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BookingSeatDto {
    private String seatNumber;
    private String rowLabel;
    private int number;
}