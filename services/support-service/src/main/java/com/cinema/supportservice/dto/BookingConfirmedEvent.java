
package com.cinema.supportservice.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.io.Serializable;

@Data
public class BookingConfirmedEvent implements Serializable {
    private static final long serialVersionUID = 1L;


    private Long bookingId;
    private Long userId;
    private String userEmail;       // Booker's email
    private String movieTitle;
    private String branchName;
    private String screenName;
    private LocalDateTime showTime;
    private List<String> seats;
    private BigDecimal totalPrice;
}