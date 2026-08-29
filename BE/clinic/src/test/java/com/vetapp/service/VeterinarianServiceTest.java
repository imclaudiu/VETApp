package com.vetapp.service;

import com.vetapp.DTO.*;
import com.vetapp.client.*;
import com.vetapp.entity.*;
import com.vetapp.repository.VeterinarianRepository;
import com.vetapp.security.AccessGuard;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class VeterinarianServiceTest {

    @Mock VeterinarianRepository repository;
    @Mock ClinicService clinicService;
    @Mock UserClient userClient;
    @Mock AuthClient authClient;
    @Mock AccessGuard accessGuard;
    @Mock Jwt jwt;

    VeterinarianService service;

    @BeforeEach
    void setUp() {
        service = new VeterinarianService(repository, clinicService, userClient, authClient, accessGuard);
    }

    @Test
    void addVeterinarian_shouldSaveAndChangeRole() {
        UUID id = UUID.randomUUID(), userId = UUID.randomUUID(), clinicId = UUID.randomUUID();
        Veterinarian vet = new Veterinarian(id, userId, clinicId, false);

        when(jwt.getTokenValue()).thenReturn("token");

        assertEquals(id, service.addVeterinarian(vet, jwt));

        verify(accessGuard).requireAdmin(jwt);
        verify(clinicService).getClinicById(clinicId);
        verify(authClient).updateAuthRole(userId, "VETERINARIAN", "token");
        verify(repository).save(vet);
    }

    @Test
    void addVeterinarian_shouldRejectDuplicateUser() {
        Veterinarian vet = new Veterinarian(UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), false);
        when(repository.existsByUserId(vet.getUserId())).thenReturn(true);

        assertEquals(HttpStatus.CONFLICT,
                assertThrows(ResponseStatusException.class, () -> service.addVeterinarian(vet, jwt)).getStatusCode());

        verify(repository, never()).save(any());
    }

    @Test
    void getVeterinarianById_shouldReturnUserName() {
        UUID id = UUID.randomUUID(), userId = UUID.randomUUID(), clinicId = UUID.randomUUID();
        Veterinarian vet = new Veterinarian(id, userId, clinicId, true);

        when(repository.findById(id)).thenReturn(Optional.of(vet));
        when(userClient.getUserById(userId)).thenReturn(new UserPublic(userId, "Dr. Alex", RolUser.VETERINARIAN));

        VeterinarianPublic result = service.getVeterinarianById(id);

        assertEquals("Dr. Alex", result.getName());
        assertTrue(result.getSurgeon());
    }

    @Test
    void updateVeterinarian_shouldUpdateSurgeon() {
        UUID id = UUID.randomUUID(), userId = UUID.randomUUID();
        Veterinarian existing = new Veterinarian(id, userId, UUID.randomUUID(), false);
        Veterinarian update = new Veterinarian();
        update.setSurgeon(true);

        when(repository.findById(id)).thenReturn(Optional.of(existing));
        when(repository.save(existing)).thenReturn(existing);

        Veterinarian result = service.updateVeterinarian(id, update, jwt);

        assertTrue(result.getSurgeon());
        verify(accessGuard).requireOwnerOrAdmin(userId, jwt);
    }

    @Test
    void deleteVeterinarian_shouldRestoreOwnerRole() {
        UUID id = UUID.randomUUID(), userId = UUID.randomUUID();
        Veterinarian vet = new Veterinarian(id, userId, UUID.randomUUID(), false);

        when(repository.findById(id)).thenReturn(Optional.of(vet));
        when(jwt.getTokenValue()).thenReturn("token");

        service.deleteVeterinarian(id, jwt);

        verify(authClient).updateAuthRole(userId, "OWNER", "token");
        verify(repository).delete(vet);
    }
}