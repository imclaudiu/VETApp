package com.vetapp.service;

import com.vetapp.DTO.*;
import com.vetapp.client.*;
import com.vetapp.entity.*;
import com.vetapp.repository.AppointmentRepository;
import com.vetapp.security.AccessGuard;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.server.ResponseStatusException;

import java.time.*;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AppointmentServiceTest {

    @Mock AppointmentRepository repository;
    @Mock PetClient petClient;
    @Mock VeterinarianClient veterinarianClient;
    @Mock AccessGuard accessGuard;
    @Mock ClinicClient clinicClient;
    @Mock NotificationProducer notificationProducer;
    @Mock Jwt jwt;

    AppointmentService service;

    UUID ownerId, vetId, vetUserId, clinicId, petId;
    LocalDateTime start;

    @BeforeEach
    void setUp() {
        service = new AppointmentService(repository, petClient, veterinarianClient, accessGuard, clinicClient, notificationProducer);
        ownerId = UUID.randomUUID();
        vetId = UUID.randomUUID();
        vetUserId = UUID.randomUUID();
        clinicId = UUID.randomUUID();
        petId = UUID.randomUUID();
        start = LocalDateTime.now(ZoneId.of("Europe/Bucharest")).plusDays(2).withHour(10).withMinute(0).withSecond(0).withNano(0);
    }

    private AppointmentPublic request() {
        return new AppointmentPublic(petId, vetId, 1L, start);
    }

    private void mockValidDependencies() {
        PetPublic pet = new PetPublic(ownerId, "Luna", "Cat", "European", LocalDate.of(2022, 1, 1), "F");
        VeterinarianPublic vet = new VeterinarianPublic(vetId, clinicId);

        VetServicePublic vetService = new VetServicePublic();
        vetService.setId(1L);
        vetService.setClinicId(clinicId);
        vetService.setDuration(30);
        vetService.setServiceName("Consultation");

        AvailabilityPublic availability = new AvailabilityPublic();
        availability.setStartHour(LocalTime.of(8, 0));
        availability.setEndHour(LocalTime.of(18, 0));

        when(petClient.checkPetNUserExists(petId)).thenReturn(pet);
        when(repository.existsByPetIdAndStatusInAndEndOfAppointmentAfter(eq(petId), anyList(), any())).thenReturn(false);
        when(veterinarianClient.checkVeterinarianExists(vetId)).thenReturn(vet);
        when(clinicClient.getService(1L)).thenReturn(vetService);
        when(clinicClient.getAvailability(vetId, start.toLocalDate())).thenReturn(availability);
    }

    @Test
    void addAppointment_shouldRejectIncompleteRequest() {
        AppointmentPublic request = new AppointmentPublic();

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> service.addAppointment(request, jwt));

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
        verify(repository, never()).save(any());
    }

    @Test
    void addAppointment_shouldRejectPetWithActiveAppointment() {
        when(petClient.checkPetNUserExists(petId))
                .thenReturn(new PetPublic(ownerId, "Luna", "Cat", "European", null, "F"));

        when(repository.existsByPetIdAndStatusInAndEndOfAppointmentAfter(eq(petId), anyList(), any())).thenReturn(true);

        assertEquals(HttpStatus.CONFLICT,
                assertThrows(ResponseStatusException.class, () -> service.addAppointment(request(), jwt)).getStatusCode());
    }

    @Test
    void addAppointment_shouldRejectServiceFromDifferentClinic() {
        when(petClient.checkPetNUserExists(petId))
                .thenReturn(new PetPublic(ownerId, "Luna", "Cat", "European", null, "F"));

        when(repository.existsByPetIdAndStatusInAndEndOfAppointmentAfter(eq(petId), anyList(), any())).thenReturn(false);
        when(veterinarianClient.checkVeterinarianExists(vetId)).thenReturn(new VeterinarianPublic(vetId, clinicId));

        VetServicePublic vetService = new VetServicePublic();
        vetService.setClinicId(UUID.randomUUID());
        when(clinicClient.getService(1L)).thenReturn(vetService);

        assertEquals(HttpStatus.BAD_REQUEST,
                assertThrows(ResponseStatusException.class, () -> service.addAppointment(request(), jwt)).getStatusCode());
    }

    @Test
    void addAppointment_shouldSavePendingAndNotifyVeterinarian() {
        mockValidDependencies();

        when(repository.findByVeterinarianIdAndStartOfAppointmentLessThanAndEndOfAppointmentGreaterThan(eq(vetId), any(), any())).thenReturn(List.of());
        when(veterinarianClient.getVeterinarianUserId(vetId)).thenReturn(vetUserId);

        UUID appointmentId = UUID.randomUUID();
        when(repository.save(any(Appointment.class))).thenAnswer(invocation -> {
            Appointment a = invocation.getArgument(0);
            a.setId(appointmentId);
            return a;
        });

        UUID result = service.addAppointment(request(), jwt);

        assertEquals(appointmentId, result);
        verify(notificationProducer).send(any(NotificationEvent.class));
    }

    @Test
    void addAppointment_shouldRejectOverlappingAppointment() {
        mockValidDependencies();

        Appointment existing = new Appointment();
        existing.setStatus(Status.CONFIRMED);

        when(repository.findByVeterinarianIdAndStartOfAppointmentLessThanAndEndOfAppointmentGreaterThan(eq(vetId), any(), any())).thenReturn(List.of(existing));

        assertEquals(HttpStatus.CONFLICT,
                assertThrows(ResponseStatusException.class, () -> service.addAppointment(request(), jwt)).getStatusCode());

        verify(repository, never()).save(any());
    }

    @Test
    void confirmAppointment_shouldConfirmAndNotifyOwner() {
        UUID id = UUID.randomUUID();
        Appointment appointment = new Appointment(id, ownerId, petId, vetId, start, start.plusMinutes(30), 1L, Status.PENDING);

        when(repository.findById(id)).thenReturn(Optional.of(appointment));
        when(veterinarianClient.getVeterinarianUserId(vetId)).thenReturn(vetUserId);
        when(repository.save(appointment)).thenReturn(appointment);

        Appointment result = service.confirmAppointment(id, jwt);

        assertEquals(Status.CONFIRMED, result.getStatus());

        ArgumentCaptor<NotificationEvent> captor = ArgumentCaptor.forClass(NotificationEvent.class);
        verify(notificationProducer).send(captor.capture());

        assertEquals(ownerId, captor.getValue().recipientUserId());
        assertEquals("APPOINTMENT_CONFIRMED", captor.getValue().type());
    }

    @Test
    void cancelAppointment_byOwner_shouldNotifyVeterinarian() {
        UUID id = UUID.randomUUID();
        Appointment appointment = new Appointment(id, ownerId, petId, vetId, start, start.plusMinutes(30), 1L, Status.CONFIRMED);

        when(repository.findById(id)).thenReturn(Optional.of(appointment));
        when(veterinarianClient.getVeterinarianUserId(vetId)).thenReturn(vetUserId);
        when(repository.save(appointment)).thenReturn(appointment);
        when(accessGuard.extractUserId(jwt)).thenReturn(ownerId);
        when(accessGuard.isAdmin(jwt)).thenReturn(false);

        service.cancelAppointment(id, jwt);

        assertEquals(Status.CANCELED, appointment.getStatus());

        ArgumentCaptor<NotificationEvent> captor = ArgumentCaptor.forClass(NotificationEvent.class);
        verify(notificationProducer).send(captor.capture());

        assertEquals(vetUserId, captor.getValue().recipientUserId());
    }

    @Test
    void markNoShow_shouldRejectFutureAppointment() {
        UUID id = UUID.randomUUID();
        Appointment appointment = new Appointment(id, ownerId, petId, vetId, start, start.plusMinutes(30), 1L, Status.CONFIRMED);

        when(repository.findById(id)).thenReturn(Optional.of(appointment));
        when(veterinarianClient.getVeterinarianUserId(vetId)).thenReturn(vetUserId);

        assertEquals(HttpStatus.CONFLICT,
                assertThrows(ResponseStatusException.class, () -> service.markNoShow(id, jwt)).getStatusCode());
    }

    @Test
    void markNoShow_shouldChangeStatusAfterStart() {
        UUID id = UUID.randomUUID();
        LocalDateTime past = LocalDateTime.now(ZoneId.of("Europe/Bucharest")).minusHours(1);
        Appointment appointment = new Appointment(id, ownerId, petId, vetId, past, past.plusMinutes(30), 1L, Status.CONFIRMED);

        when(repository.findById(id)).thenReturn(Optional.of(appointment));
        when(veterinarianClient.getVeterinarianUserId(vetId)).thenReturn(vetUserId);
        when(repository.save(appointment)).thenReturn(appointment);

        service.markNoShow(id, jwt);

        assertEquals(Status.NO_SHOW, appointment.getStatus());
        verify(notificationProducer).send(any(NotificationEvent.class));
    }

    @Test
    void finishAppointmentInternal_shouldFinishConfirmedAppointment() {
        UUID id = UUID.randomUUID();
        LocalDateTime past = LocalDateTime.now(ZoneId.of("Europe/Bucharest")).minusHours(1);
        Appointment appointment = new Appointment(id, ownerId, petId, vetId, past, past.plusMinutes(30), 1L, Status.CONFIRMED);

        when(repository.findById(id)).thenReturn(Optional.of(appointment));

        service.finishAppointmentInternal(id);

        assertEquals(Status.FINISHED, appointment.getStatus());
        verify(repository).save(appointment);
    }
}