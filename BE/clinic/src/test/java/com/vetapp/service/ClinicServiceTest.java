package com.vetapp.service;

import com.vetapp.entity.Clinic;
import com.vetapp.repository.ClinicRepository;
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
class ClinicServiceTest {

    @Mock ClinicRepository repository;
    @Mock AccessGuard accessGuard;
    @Mock Jwt jwt;
    ClinicService service;

    @BeforeEach
    void setUp() {
        service = new ClinicService(repository, accessGuard);
    }

    @Test
    void addClinic_shouldRequireAdminAndSave() {
        UUID id = UUID.randomUUID();
        Clinic clinic = new Clinic(id, "Vet", "Address", "Cluj", "0711", 4.8, "place", 46.7, 23.5);

        assertEquals(id, service.addClinic(clinic, jwt));

        verify(accessGuard).requireAdmin(jwt);
        verify(repository).save(clinic);
    }

    @Test
    void getClinicById_shouldThrowNotFound() {
        UUID id = UUID.randomUUID();
        when(repository.findById(id)).thenReturn(Optional.empty());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> service.getClinicById(id));

        assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
    }

    @Test
    void getClinicsByCity_shouldRejectEmptyList() {
        when(repository.findByCityIgnoreCase("Cluj")).thenReturn(Optional.of(List.of()));

        assertEquals(HttpStatus.NOT_FOUND,
                assertThrows(ResponseStatusException.class, () -> service.getClinicsByCity("Cluj")).getStatusCode());
    }

    @Test
    void updateClinic_shouldUpdateOnlyProvidedFields() {
        UUID id = UUID.randomUUID();
        Clinic existing = new Clinic(id, "Old", "Address", "Cluj", "0700", 4.0, "old", 46.0, 23.0);
        Clinic update = new Clinic();
        update.setName("New");
        update.setRating(4.9);

        when(repository.findById(id)).thenReturn(Optional.of(existing));
        when(repository.save(existing)).thenReturn(existing);

        Clinic result = service.updateClinic(id, update, jwt);

        assertEquals("New", result.getName());
        assertEquals(4.9, result.getRating());
        assertEquals("Address", result.getAddress());
    }

    @Test
    void deleteClinic_shouldDeleteExistingClinic() {
        UUID id = UUID.randomUUID();
        Clinic clinic = new Clinic();
        when(repository.findById(id)).thenReturn(Optional.of(clinic));

        service.deleteClinic(id, jwt);

        verify(accessGuard).requireAdmin(jwt);
        verify(repository).delete(clinic);
    }
}