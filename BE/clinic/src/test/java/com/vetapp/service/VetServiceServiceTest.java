package com.vetapp.service;

import com.vetapp.entity.*;
import com.vetapp.repository.*;
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
class VetServiceServiceTest {

    @Mock VetServiceRepository repository;
    @Mock ClinicService clinicService;
    @Mock VeterinarianRepository veterinarianRepository;
    @Mock AccessGuard accessGuard;
    @Mock Jwt jwt;

    VetServiceService service;

    @BeforeEach
    void setUp() {
        service = new VetServiceService(repository, clinicService, veterinarianRepository, accessGuard);
    }

    @Test
    void addService_shouldSave() {
        UUID clinicId = UUID.randomUUID();
        VetService vetService = new VetService(1L, clinicId, "Consultation", 30, 150.0, "General");

        assertEquals(1L, service.addService(vetService, jwt));

        verify(accessGuard).requireAdmin(jwt);
        verify(clinicService).getClinicById(clinicId);
        verify(repository).save(vetService);
    }

    @Test
    void addService_shouldRejectDuplicateName() {
        UUID clinicId = UUID.randomUUID();
        VetService vetService = new VetService(null, clinicId, "Consultation", 30, 150.0, null);
        when(repository.existsByClinicIdAndServiceNameIgnoreCase(clinicId, "Consultation")).thenReturn(true);

        assertEquals(HttpStatus.CONFLICT,
                assertThrows(ResponseStatusException.class, () -> service.addService(vetService, jwt)).getStatusCode());
    }

    @Test
    void getServiceById_shouldThrowNotFound() {
        when(repository.findById(1L)).thenReturn(Optional.empty());

        assertEquals(HttpStatus.NOT_FOUND,
                assertThrows(ResponseStatusException.class, () -> service.getServiceById(1L)).getStatusCode());
    }

    @Test
    void checkServiceForVeterinarian_shouldReturnClinic() {
        UUID vetId = UUID.randomUUID(), clinicId = UUID.randomUUID();
        when(veterinarianRepository.findById(vetId)).thenReturn(Optional.of(new Veterinarian(vetId, UUID.randomUUID(), clinicId, false)));
        when(repository.findById(1L)).thenReturn(Optional.of(new VetService(1L, clinicId, "Consult", 30, 100.0, null)));

        assertEquals(clinicId, service.checkServiceForVeterinarian(vetId, 1L));
    }

    @Test
    void checkServiceForVeterinarian_shouldRejectDifferentClinic() {
        UUID vetId = UUID.randomUUID();

        when(veterinarianRepository.findById(vetId))
                .thenReturn(Optional.of(new Veterinarian(vetId, UUID.randomUUID(), UUID.randomUUID(), false)));

        when(repository.findById(1L))
                .thenReturn(Optional.of(new VetService(1L, UUID.randomUUID(), "Consult", 30, 100.0, null)));

        assertEquals(HttpStatus.CONFLICT,
                assertThrows(ResponseStatusException.class, () -> service.checkServiceForVeterinarian(vetId, 1L)).getStatusCode());
    }
}