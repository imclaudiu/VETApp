package com.vetapp.service;

import com.vetapp.DTO.AvailabilityId;
import com.vetapp.entity.Availability;
import com.vetapp.repository.AvailabilityRepository;
import com.vetapp.security.AccessGuard;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.server.ResponseStatusException;

import java.time.*;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AvailabilityServiceTest {

    @Mock AvailabilityRepository repository;
    @Mock VeterinarianService veterinarianService;
    @Mock AccessGuard accessGuard;
    @Mock Jwt jwt;

    AvailabilityService service;

    @BeforeEach
    void setUp() {
        service = new AvailabilityService(repository, veterinarianService, accessGuard);
    }

    private Availability valid(UUID vetId) {
        return new Availability(new AvailabilityId(vetId, LocalDate.now().plusDays(1)), LocalTime.of(8, 0), LocalTime.of(16, 0));
    }

    @Test
    void addAvailability_shouldRejectInvalidHours() {
        Availability a = valid(UUID.randomUUID());
        a.setEndHour(LocalTime.of(7, 0));

        assertEquals(HttpStatus.BAD_REQUEST,
                assertThrows(ResponseStatusException.class, () -> service.addAvailability(a, jwt)).getStatusCode());
    }

    @Test
    void addAvailability_shouldRejectDuplicate() {
        UUID vetId = UUID.randomUUID();
        Availability a = valid(vetId);

        when(veterinarianService.getVeterinarianUserId(vetId)).thenReturn(UUID.randomUUID());
        when(repository.existsById(a.getId())).thenReturn(true);

        assertEquals(HttpStatus.CONFLICT,
                assertThrows(ResponseStatusException.class, () -> service.addAvailability(a, jwt)).getStatusCode());
    }

    @Test
    void addAvailability_shouldSave() {
        UUID vetId = UUID.randomUUID(), userId = UUID.randomUUID();
        Availability a = valid(vetId);

        when(veterinarianService.getVeterinarianUserId(vetId)).thenReturn(userId);
        when(repository.save(a)).thenReturn(a);

        assertSame(a, service.addAvailability(a, jwt));

        verify(accessGuard).requireOwnerOrAdmin(userId, jwt);
        verify(repository).save(a);
    }

    @Test
    void updateAvailability_shouldRejectEndBeforeStart() {
        UUID vetId = UUID.randomUUID(), userId = UUID.randomUUID();
        LocalDate day = LocalDate.now();
        Availability existing = new Availability(new AvailabilityId(vetId, day), LocalTime.of(8, 0), LocalTime.of(16, 0));
        Availability update = new Availability();
        update.setEndHour(LocalTime.of(7, 0));

        when(veterinarianService.getVeterinarianUserId(vetId)).thenReturn(userId);
        when(repository.findById(new AvailabilityId(vetId, day))).thenReturn(Optional.of(existing));

        assertEquals(HttpStatus.BAD_REQUEST,
                assertThrows(ResponseStatusException.class, () -> service.updateAvailability(vetId, day, update, jwt)).getStatusCode());
    }

    @Test
    void deleteAvailability_shouldDelete() {
        UUID vetId = UUID.randomUUID();
        LocalDate day = LocalDate.now();
        Availability a = valid(vetId);

        when(veterinarianService.getVeterinarianUserId(vetId)).thenReturn(UUID.randomUUID());
        when(repository.findById(new AvailabilityId(vetId, day))).thenReturn(Optional.of(a));

        service.deleteAvailability(vetId, day, jwt);

        verify(repository).delete(a);
    }
}