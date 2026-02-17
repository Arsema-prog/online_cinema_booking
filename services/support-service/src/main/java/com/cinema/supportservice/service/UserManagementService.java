package com.cinema.supportservice.service;

import com.cinema.supportservice.dto.UpdateUserRequest;
import com.cinema.supportservice.dto.UserDto;
import com.cinema.supportservice.model.User;
import com.cinema.supportservice.repository.UserRepository;
import jakarta.ws.rs.NotFoundException;
import jakarta.ws.rs.core.Response;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.resource.RealmResource;
import org.keycloak.admin.client.resource.UserResource;
import org.keycloak.admin.client.resource.UsersResource;
import org.keycloak.representations.idm.CredentialRepresentation;
import org.keycloak.representations.idm.RoleRepresentation;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserManagementService {

    private final Keycloak keycloakAdmin;
    private final UserRepository userRepository;

    @Value("${keycloak.admin.realm}")
    private String realm;

    private RealmResource getRealm() {
        return keycloakAdmin.realm(realm);
    }

    private UsersResource usersResource() {
        return getRealm().users();
    }

    @Transactional(readOnly = true)
    public Page<UserDto> listUsers(String search, Pageable pageable) {
        List<UserRepresentation> users;
        if (search != null && !search.isEmpty()) {
            users = usersResource().search(search, (int) pageable.getOffset(), pageable.getPageSize());
        } else {
            users = usersResource().list((int) pageable.getOffset(), pageable.getPageSize());
        }
        long total = usersResource().count(); // approximate
        List<UserDto> content = users.stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public UserDto getUser(String userId) {
        try {
            UserResource userResource = usersResource().get(userId);
            UserRepresentation user = userResource.toRepresentation();
            return mapToDto(userResource, user);
        } catch (NotFoundException e) {
            throw new RuntimeException("User not found with id: " + userId);
        }
    }

    @Transactional
    public UserDto updateUser(String userId, UpdateUserRequest request) {
        UserResource userResource = usersResource().get(userId);
        UserRepresentation user = userResource.toRepresentation();
        if (request.getEmail() != null) user.setEmail(request.getEmail());
        if (request.getFirstName() != null) user.setFirstName(request.getFirstName());
        if (request.getLastName() != null) user.setLastName(request.getLastName());
        if (request.getEnabled() != null) user.setEnabled(request.getEnabled());
        userResource.update(user);
        syncUserToLocal(userId);
        return getUser(userId);
    }

    @Transactional
    public void deleteUser(String userId) {
        usersResource().get(userId).remove();
        userRepository.findByKeycloakId(userId).ifPresent(userRepository::delete);
    }

    @Transactional
    public void resetPassword(String userId, String newPassword) {
        UserResource userResource = usersResource().get(userId);
        CredentialRepresentation credential = new CredentialRepresentation();
        credential.setType(CredentialRepresentation.PASSWORD);
        credential.setValue(newPassword);
        credential.setTemporary(false);
        userResource.resetPassword(credential);
    }

    @Transactional
    public void assignRoles(String userId, List<String> roleNames) {
        UserResource userResource = usersResource().get(userId);
        List<RoleRepresentation> realmRoles = getRealm().roles().list();
        List<RoleRepresentation> rolesToAdd = realmRoles.stream()
                .filter(role -> roleNames.contains(role.getName()))
                .collect(Collectors.toList());
        userResource.roles().realmLevel().add(rolesToAdd);
        syncUserToLocal(userId);
    }

    @Transactional
    public void removeRoles(String userId, List<String> roleNames) {
        UserResource userResource = usersResource().get(userId);
        List<RoleRepresentation> realmRoles = getRealm().roles().list();
        List<RoleRepresentation> rolesToRemove = realmRoles.stream()
                .filter(role -> roleNames.contains(role.getName()))
                .collect(Collectors.toList());
        userResource.roles().realmLevel().remove(rolesToRemove);
        syncUserToLocal(userId);
    }

    private void syncUserToLocal(String userId) {
        UserResource userResource = usersResource().get(userId);
        UserRepresentation kcUser = userResource.toRepresentation();
        User localUser = userRepository.findByKeycloakId(userId)
                .orElse(new User());
        localUser.setKeycloakId(kcUser.getId());
        localUser.setUsername(kcUser.getUsername());
        localUser.setEmail(kcUser.getEmail());
        localUser.setFirstName(kcUser.getFirstName());
        localUser.setLastName(kcUser.getLastName());
        localUser.setEnabled(kcUser.isEnabled());
        localUser.setCreatedTimestamp(kcUser.getCreatedTimestamp() != null ?
                Instant.ofEpochMilli(kcUser.getCreatedTimestamp()) : null);
        userRepository.save(localUser);
    }

    private UserDto mapToDto(UserRepresentation user) {
        UserDto dto = new UserDto();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setFirstName(user.getFirstName());
        dto.setLastName(user.getLastName());
        dto.setEnabled(user.isEnabled());
        dto.setCreatedTimestamp(user.getCreatedTimestamp() != null ?
                Instant.ofEpochMilli(user.getCreatedTimestamp()) : null);
        return dto;
    }

    private UserDto mapToDto(UserResource resource, UserRepresentation user) {
        UserDto dto = mapToDto(user);
        List<String> roleNames = resource.roles().realmLevel().listAll()
                .stream().map(RoleRepresentation::getName)
                .collect(Collectors.toList());
        dto.setRoles(roleNames);
        return dto;
    }
}