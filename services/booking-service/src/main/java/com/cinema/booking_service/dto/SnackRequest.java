package com.cinema.booking_service.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class SnackRequest {
    private String snackDetails;
    private BigDecimal snacksTotal;
}
