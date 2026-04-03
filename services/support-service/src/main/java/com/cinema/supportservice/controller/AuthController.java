package com.cinema.supportservice.controller;

import com.cinema.supportservice.dto.RegistrationRequest;
import com.cinema.supportservice.service.RegistrationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/auth", "/api/auth"})
@RequiredArgsConstructor
public class AuthController {

    private final RegistrationService registrationService;

    @PostMapping("/register")
    public ResponseEntity<Void> register(@Valid @RequestBody RegistrationRequest request) {
        System.out.println("=== REGISTER ENDPOINT CALLED ===");
        System.out.println("Request: " + request);
        registrationService.registerUser(request);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

}
