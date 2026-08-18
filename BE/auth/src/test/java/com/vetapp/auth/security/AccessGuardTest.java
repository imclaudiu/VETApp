package com.vetapp.auth.security;

import com.vetapp.security.AccessGuard;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AccessGuardTest {

    private AccessGuard accessGuard;
    private Jwt jwt;

    @BeforeEach
    void setUp() {
        accessGuard = new AccessGuard();
        jwt = mock(Jwt.class);
    }

    @Test
    void extractUserId_shouldReturnUserIdFromJwt() {
        UUID userId = UUID.randomUUID();

        when(jwt.getClaimAsString("userId"))
                .thenReturn(userId.toString());

        UUID result = accessGuard.extractUserId(jwt);

        assertEquals(userId, result);
    }

    @Test
    void extractRole_shouldReturnRoleFromJwt() {
        when(jwt.getClaimAsString("role"))
                .thenReturn("ADMIN");

        String role = accessGuard.extractRole(jwt);

        assertEquals("ADMIN", role);
    }

    @Test
    void isAdmin_shouldReturnTrue_whenRoleIsAdmin() {
        when(jwt.getClaimAsString("role"))
                .thenReturn("ADMIN");

        assertTrue(accessGuard.isAdmin(jwt));
    }

    @Test
    void isAdmin_shouldReturnFalse_whenRoleIsNotAdmin() {
        when(jwt.getClaimAsString("role"))
                .thenReturn("OWNER");

        assertFalse(accessGuard.isAdmin(jwt));
    }

    @Test
    void requireAdmin_shouldNotThrow_whenUserIsAdmin() {
        when(jwt.getClaimAsString("role"))
                .thenReturn("ADMIN");

        assertDoesNotThrow(
                () -> accessGuard.requireAdmin(jwt)
        );
    }

    @Test
    void requireAdmin_shouldThrowForbidden_whenUserIsNotAdmin() {
        when(jwt.getClaimAsString("role"))
                .thenReturn("OWNER");

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> accessGuard.requireAdmin(jwt)
        );

        assertEquals(
                HttpStatus.FORBIDDEN,
                exception.getStatusCode()
        );
    }

    @Test
    void requireOwnerOrAdmin_shouldAllowOwner() {
        UUID ownerId = UUID.randomUUID();

        when(jwt.getClaimAsString("userId"))
                .thenReturn(ownerId.toString());

        assertDoesNotThrow(
                () -> accessGuard.requireOwnerOrAdmin(ownerId, jwt)
        );
    }

    @Test
    void requireOwnerOrAdmin_shouldAllowAdminEvenIfNotOwner() {
        UUID resourceOwnerId = UUID.randomUUID();
        UUID adminId = UUID.randomUUID();

        when(jwt.getClaimAsString("userId"))
                .thenReturn(adminId.toString());

        when(jwt.getClaimAsString("role"))
                .thenReturn("ADMIN");

        assertDoesNotThrow(
                () -> accessGuard.requireOwnerOrAdmin(
                        resourceOwnerId,
                        jwt
                )
        );
    }

    @Test
    void requireOwnerOrAdmin_shouldThrowForbidden_whenUserIsNeitherOwnerNorAdmin() {
        UUID resourceOwnerId = UUID.randomUUID();
        UUID currentUserId = UUID.randomUUID();

        when(jwt.getClaimAsString("userId"))
                .thenReturn(currentUserId.toString());

        when(jwt.getClaimAsString("role"))
                .thenReturn("OWNER");

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> accessGuard.requireOwnerOrAdmin(
                        resourceOwnerId,
                        jwt
                )
        );

        assertEquals(
                HttpStatus.FORBIDDEN,
                exception.getStatusCode()
        );
    }
}