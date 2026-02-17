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
                throw new RuntimeException("Failed to create user in authentication server: " + error);
            }

            String location = response.getLocation().toString();
            keycloakUserId = location.substring(location.lastIndexOf("/") + 1);
        }

        RoleRepresentation role = realmResource.roles()
                .get(DEFAULT_ROLE)
                .toRepresentation();

        realmResource.users()
                .get(keycloakUserId)
                .roles()
                .realmLevel()
                .add(Collections.singletonList(role));

        User localUser = new User();
        localUser.setKeycloakId(keycloakUserId);
        localUser.setUsername(request.getUsername());
        localUser.setEmail(request.getEmail());
        localUser.setFirstName(request.getFirstName());
        localUser.setLastName(request.getLastName());
        localUser.setEnabled(true);
        localUser.setCreatedTimestamp(Instant.now());

        userRepository.save(localUser);
    }
}
