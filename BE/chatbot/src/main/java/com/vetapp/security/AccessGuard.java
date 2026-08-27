package com.vetapp.security;

import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
public class AccessGuard {

    private static final String OWNER_ROLE = "OWNER";

    public String extractRole(Jwt jwt) {
        return jwt.getClaimAsString("role");
    }

    public boolean isOwner(Jwt jwt) {
        return OWNER_ROLE.equals(extractRole(jwt));
    }

    public void requireOwner(Jwt jwt) {

        if (!isOwner(jwt)) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Chatbotul este disponibil doar proprietarilor."
            );
        }
    }
}