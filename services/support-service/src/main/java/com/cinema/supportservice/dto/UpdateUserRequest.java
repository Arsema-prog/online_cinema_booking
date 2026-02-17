package com.cinema.supportservice.dto;

import lombok.Data;

@Data
public class UpdateUserRequest {
    private String email;
    private String firstName;
    private String lastName;
    private Boolean enabled;
}