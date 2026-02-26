package com.cinema.supportservice.service;

import com.cinema.supportservice.dto.RegistrationRequest;
import com.cinema.supportservice.model.User;
import com.cinema.supportservice.repository.UserRepository;
import jakarta.ws.rs.core.Response;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.resource.RealmResource;
import org.keycloak.admin.client.resource.UsersResource;
import org.keycloak.representations.idm.CredentialRepresentation;
import org.keycloak.representations.idm.RoleRepresentation;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class RegistrationService {

    private static final String DEFAULT_ROLE = "USER";

    private final Keycloak keycloakAdmin;
    private final UserRepository userRepository;

    @Value("${keycloak.admin.realm}")
    private String realm;

    @Transactional
    public void registerUser(RegistrationRequest request) {

        RealmResource realmResource = keycloakAdmin.realm(realm);
        UsersResource usersResource = realmResource.users();

        // 1. Duplicate checks
        List<UserRepresentation> existingUsers =
                usersResource.search(request.getUsername(), true);
        if (!existingUsers.isEmpty()) {
            throw new RuntimeException("Username already exists in authentication system");
        }
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username already exists");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        // 2. Determine and validate roles BEFORE creating the user
        List<String> requestedRoles = request.getRoles();
        List<String> rolesToAssign;

        if (requestedRoles == null || requestedRoles.isEmpty()) {
            rolesToAssign = Collections.singletonList(DEFAULT_ROLE);
        } else {
            // Public registration can only assign USER role
            for (String role : requestedRoles) {
                if (!DEFAULT_ROLE.equals(role)) {
                    throw new RuntimeException("Only default USER role can be assigned during public registration");
                }
            }
            rolesToAssign = requestedRoles;
        }

        // Fetch all realm roles once (needed for validation and assignment)
        List<RoleRepresentation> realmRoles = realmResource.roles().list();

        // Validate that all intended roles exist
        for (String roleName : rolesToAssign) {
            boolean exists = realmRoles.stream().anyMatch(r -> r.getName().equals(roleName));
            if (!exists) {
                throw new RuntimeException("Role '" + roleName + "' does not exist");
            }
        }

        // 3. Create the user in Keycloak
        UserRepresentation user = new UserRepresentation();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setEnabled(true);
        user.setEmailVerified(true);

        CredentialRepresentation credential = new CredentialRepresentation();
        credential.setType(CredentialRepresentation.PASSWORD);
        credential.setValue(request.getPassword());
        credential.setTemporary(false);
        user.setCredentials(Collections.singletonList(credential));

        String keycloakUserId;
        try (Response response = usersResource.create(user)) {
            if (response.getStatus() != Response.Status.CREATED.getStatusCode()) {
                String error = response.readEntity(String.class);
                log.error("Failed to create user in Keycloak: {}", error);
                throw new RuntimeException("Failed to create user in authentication server: " + error);
            }

            String location = response.getLocation().toString();
            keycloakUserId = location.substring(location.lastIndexOf("/") + 1);
        }

        // 4. Assign roles (now we already have realmRoles)
        List<RoleRepresentation> rolesToAdd = new ArrayList<>();
        for (String roleName : rolesToAssign) {
            realmRoles.stream()
                    .filter(r -> r.getName().equals(roleName))
                    .findFirst()
                    .ifPresent(rolesToAdd::add);
        }

        if (!rolesToAdd.isEmpty()) {
            realmResource.users()
                    .get(keycloakUserId)
                    .roles()
                    .realmLevel()
                    .add(rolesToAdd);
        }

        // 5. Save local copy
        User localUser = new User();
        localUser.setKeycloakId(keycloakUserId);
        localUser.setUsername(request.getUsername());
        localUser.setEmail(request.getEmail());
        localUser.setFirstName(request.getFirstName());
        localUser.setLastName(request.getLastName());
        localUser.setEnabled(true);
        localUser.setCreatedTimestamp(Instant.now());

        userRepository.save(localUser);

        log.info("User {} registered successfully with roles: {}", request.getUsername(), rolesToAssign);
    }
}