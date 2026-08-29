package com.vetapp.service;

import com.vetapp.DTO.*;
import com.vetapp.client.*;
import com.vetapp.entity.MedicalRecord;
import com.vetapp.repository.MedicalRecordRepository;
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
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MedicalRecordServiceTest {

    @Mock MedicalRecordRepository repository;
    @Mock AppointmentClient appointmentClient;
    @Mock ClinicClient clinicClient;
    @Mock PetClient petClient;
    @Mock VeterinarianClient veterinarianClient;
    @Mock AccessGuard accessGuard;
    @Mock NotificationProducer notificationProducer;
    @Mock Jwt jwt;

    MedicalRecordService service;

    UUID appointmentId, petId, ownerId, vetId, vetUserId, clinicId;

    @BeforeEach
    void setUp() {
        service = new MedicalRecordService(repository, appointmentClient, clinicClient, petClient, veterinarianClient, accessGuard, notificationProducer);

        appointmentId = UUID.randomUUID();
        petId = UUID.randomUUID();
        ownerId = UUID.randomUUID();
        vetId = UUID.randomUUID();
        vetUserId = UUID.randomUUID();
        clinicId = UUID.randomUUID();
    }

    private AppointmentMedical appointment(String status, LocalDateTime start) {
        AppointmentMedical a = new AppointmentMedical();
        a.setId(appointmentId);
        a.setPetId(petId);
        a.setOwnerId(ownerId);
        a.setVeterinarianId(vetId);
        a.setVetServiceId(1L);
        a.setStartOfAppointment(start);
        a.setStatus(status);
        return a;
    }

    private RegisterMedicalRecord request() {
        RegisterMedicalRecord r = new RegisterMedicalRecord();
        r.setAppointmentId(appointmentId);
        r.setSymptoms("Vomiting");
        r.setDiagnosis("Gastritis");
        r.setObservations("Monitor");
        r.setWeight(4.5);
        r.setTemperature(38.4);
        return r;
    }

    @Test
    void addMedicalRecord_shouldRejectNonConfirmedAppointment() {
        when(appointmentClient.checkAppointmentExists(appointmentId))
                .thenReturn(appointment("CANCELED", LocalDateTime.now().minusHours(1)));

        assertEquals(HttpStatus.CONFLICT,
                assertThrows(ResponseStatusException.class, () -> service.addMedicalRecord(request(), jwt)).getStatusCode());
    }

    @Test
    void addMedicalRecord_shouldRejectFutureConsultation() {
        when(appointmentClient.checkAppointmentExists(appointmentId))
                .thenReturn(appointment("CONFIRMED", LocalDateTime.now().plusDays(1)));

        assertEquals(HttpStatus.CONFLICT,
                assertThrows(ResponseStatusException.class, () -> service.addMedicalRecord(request(), jwt)).getStatusCode());
    }

    @Test
    void addMedicalRecord_shouldRejectDuplicate() {
        when(appointmentClient.checkAppointmentExists(appointmentId))
                .thenReturn(appointment("CONFIRMED", LocalDateTime.now().minusHours(1)));

        when(repository.existsByAppointmentId(appointmentId)).thenReturn(true);

        assertEquals(HttpStatus.CONFLICT,
                assertThrows(ResponseStatusException.class, () -> service.addMedicalRecord(request(), jwt)).getStatusCode());
    }

    @Test
    void addMedicalRecord_shouldSaveFinishAppointmentAndNotifyOwner() {
        AppointmentMedical appointment = appointment("CONFIRMED", LocalDateTime.now().minusHours(1));

        when(appointmentClient.checkAppointmentExists(appointmentId)).thenReturn(appointment);
        when(clinicClient.checkServiceForVeterinarian(vetId, 1L)).thenReturn(clinicId);
        when(petClient.getPetById(petId)).thenReturn(new PetPublic(petId, ownerId, "Luna", "Cat", "European", null, "F"));

        UUID recordId = UUID.randomUUID();

        when(repository.save(any(MedicalRecord.class))).thenAnswer(invocation -> {
            MedicalRecord record = invocation.getArgument(0);
            record.setId(recordId);
            return record;
        });

        UUID result = service.addMedicalRecord(request(), jwt);

        assertEquals(recordId, result);
        verify(appointmentClient).finishAppointment(appointmentId);

        ArgumentCaptor<NotificationEvent> captor = ArgumentCaptor.forClass(NotificationEvent.class);
        verify(notificationProducer).send(captor.capture());

        assertEquals(ownerId, captor.getValue().recipientUserId());
        assertEquals("MEDICAL_RECORD_ADDED", captor.getValue().type());
    }

    @Test
    void addMedicalRecord_shouldRollbackWhenFinishAppointmentFails() {
        AppointmentMedical appointment = appointment("CONFIRMED", LocalDateTime.now().minusHours(1));
        MedicalRecord saved = new MedicalRecord();
        saved.setId(UUID.randomUUID());

        when(appointmentClient.checkAppointmentExists(appointmentId)).thenReturn(appointment);
        when(clinicClient.checkServiceForVeterinarian(vetId, 1L)).thenReturn(clinicId);
        when(repository.save(any(MedicalRecord.class))).thenReturn(saved);

        doThrow(new RuntimeException("Appointment error"))
                .when(appointmentClient).finishAppointment(appointmentId);

        assertThrows(RuntimeException.class, () -> service.addMedicalRecord(request(), jwt));

        verify(repository).delete(saved);
        verify(notificationProducer, never()).send(any());
    }

    @Test
    void getMedicalRecordsByPetId_shouldCheckOwner() {
        when(petClient.getPetById(petId)).thenReturn(new PetPublic(petId, ownerId, "Luna", "Cat", "European", null, "F"));
        when(repository.findByPetIdOrderByConsultationDateDesc(petId)).thenReturn(List.of());

        service.getMedicalRecordsByPetId(petId, jwt);

        verify(accessGuard).requireOwnerOrAdmin(ownerId, jwt);
    }

    @Test
    void deleteMedicalRecord_shouldRejectMissingRecord() {
        UUID id = UUID.randomUUID();
        when(repository.existsById(id)).thenReturn(false);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> service.deleteMedicalRecord(id, jwt));

        assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
        verify(repository, never()).deleteById(id);
    }
}