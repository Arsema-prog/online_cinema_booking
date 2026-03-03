package com.cinema.supportservice.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;

@Data
public class RegistrationRequest {

    @NotBlank
    private String username;

    @NotBlank
    private String password;

    @Email
    private String email;

    private String firstName;
    private String lastName;

    // Optional roles – if null or empty, default role USER will be assigned
    private List<String> roles;
}