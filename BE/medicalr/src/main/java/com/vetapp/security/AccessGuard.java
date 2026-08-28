package com.vetapp.security;

import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Component
public class AccessGuard {

    private static final String ADMIN_ROLE = "ADMIN";

    public UUID extractUserId(Jwt jwt) {
        return UUID.fromString(jwt.getClaimAsString("userId"));
    }

    public String extractRole(Jwt jwt) {
        return jwt.getClaimAsString("role");
    }

    public boolean isAdmin(Jwt jwt) {
        return ADMIN_ROLE.equals(extractRole(jwt));
    }

    public void requireAdmin(Jwt jwt) {
        if (!isAdmin(jwt)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acces permis doar administratorilor.");
        }
    }


    public void requireRole(Jwt jwt, String... allowedRoles) {
        String role = extractRole(jwt);
        boolean allowed = java.util.Arrays.asList(allowedRoles).contains(role);
        if (!allowed) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Nu ai rolul necesar pentru această acțiune.");
        }
    }


    public void requireOneOfOrAdmin(Jwt jwt, UUID... allowedUserIds) {
        if (isAdmin(jwt)) {
            return;
        }
        UUID requesterId = extractUserId(jwt);
        boolean allowed = java.util.Arrays.stream(allowedUserIds)
                .anyMatch(id -> id != null && id.equals(requesterId));

        if (!allowed) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Nu ai acces la această resursă.");
        }
    }

    public void requireOwnerOrAdmin(UUID resourceOwnerId, Jwt jwt) {
        boolean isOwner = resourceOwnerId.equals(extractUserId(jwt));
        if (!isOwner && !isAdmin(jwt)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Nu ai acces la această resursă.");
        }
    }
}