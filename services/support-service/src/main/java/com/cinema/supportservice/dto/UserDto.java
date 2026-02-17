package com.cinema.supportservice.dto;

import lombok.Data;
import java.time.Instant;
import java.util.List;

@Data
public class UserDto {
    private String id;          // Keycloak ID
    private String username;
    private String email;
    private String firstName;
    private String lastName;
    private Boolean enabled;
    private List<String> roles;
    private Instant createdTimestamp;
}