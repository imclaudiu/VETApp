package com.vetapp.security;

import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Component
public class AccessGuard {

    private static final String ADMIN_ROLE = "ADMIN";
    private static final String VETERINARIAN_ROLE = "VETERINARIAN";

    public UUID extractUserId(Jwt jwt) {
        return UUID.fromString(jwt.getClaimAsString("userId"));
    }

    public String extractRole(Jwt jwt) {
        return jwt.getClaimAsString("role");
    }

    public boolean isAdmin(Jwt jwt) {
        return ADMIN_ROLE.equals(extractRole(jwt));
    }

    public boolean isVeterinarian(Jwt jwt) {
        return VETERINARIAN_ROLE.equals(extractRole(jwt));
    }

    public void requireAdmin(Jwt jwt) {
        if (!isAdmin(jwt)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acces permis doar administratorilor.");
        }
    }



    public void requireOwnerOrAdmin(UUID resourceOwnerId, Jwt jwt) {
        boolean isOwner = resourceOwnerId.equals(extractUserId(jwt));
        if (!isOwner && !isAdmin(jwt)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Nu ai acces la această resursă.");
        }
    }
    public void requireVeterinarianOrAdmin(Jwt jwt) {
        if (!isVeterinarian(jwt) && !isAdmin(jwt)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Doar medicii veterinari sau administratorii pot modifica animalele."
            );
        }
    }


    public void requireOwnerVeterinarianOrAdmin(UUID ownerId, Jwt jwt) {
        boolean isOwner = ownerId != null && ownerId.equals(extractUserId(jwt));

        if (!isOwner && !isVeterinarian(jwt) && !isAdmin(jwt)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Nu ai acces la acest animal."
            );
        }
    }
}