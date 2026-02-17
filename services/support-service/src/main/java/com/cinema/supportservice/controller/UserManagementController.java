package com.cinema.supportservice.controller;

import com.cinema.supportservice.dto.PasswordResetRequest;
import com.cinema.supportservice.dto.UpdateUserRequest;
import com.cinema.supportservice.dto.UserDto;
import com.cinema.supportservice.service.UserManagementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserManagementController {

    private final UserManagementService userService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<Page<UserDto>> listUsers(
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20, sort = "username", direction = Sort.Direction.ASC) Pageable pageable) {
        return ResponseEntity.ok(userService.listUsers(search, pageable));
    }

    @GetMapping("/{userId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<UserDto> getUser(@PathVariable String userId) {
        return ResponseEntity.ok(userService.getUser(userId));
    }

    @PutMapping("/{userId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<UserDto> updateUser(@PathVariable String userId,
                                              @Valid @RequestBody UpdateUserRequest request) {
        return ResponseEntity.ok(userService.updateUser(userId, request));
    }

    @DeleteMapping("/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteUser(@PathVariable String userId) {
        userService.deleteUser(userId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{userId}/reset-password")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<Void> resetPassword(@PathVariable String userId,
                                              @Valid @RequestBody PasswordResetRequest request) {
        userService.resetPassword(userId, request.getNewPassword());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{userId}/roles")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<Void> assignRoles(@PathVariable String userId,
                                            @RequestBody List<String> roleNames) {
        userService.assignRoles(userId, roleNames);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{userId}/roles")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<Void> removeRoles(@PathVariable String userId,
                                            @RequestBody List<String> roleNames) {
        userService.removeRoles(userId, roleNames);
        return ResponseEntity.ok().build();
    }
}