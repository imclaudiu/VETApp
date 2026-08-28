package com.vetapp.service;

import com.vetapp.DTO.AppointmentMedical;
import com.vetapp.DTO.NotificationEvent;
import com.vetapp.DTO.PetPublic;
import com.vetapp.DTO.RegisterMedicalRecord;
import com.vetapp.client.AppointmentClient;
import com.vetapp.client.ClinicClient;
import com.vetapp.client.PetClient;
import com.vetapp.client.VeterinarianClient;
import com.vetapp.entity.MedicalRecord;
import com.vetapp.repository.MedicalRecordRepository;
import com.vetapp.security.AccessGuard;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

@Service
public class MedicalRecordService {

    private final MedicalRecordRepository medicalRecordRepository;
    private final AppointmentClient appointmentClient;
    private final ClinicClient clinicClient;
    private final PetClient petClient;
    private final VeterinarianClient veterinarianClient;
    private final AccessGuard accessGuard;
    private final NotificationProducer notificationProducer;

    public MedicalRecordService(MedicalRecordRepository medicalRecordRepository,
                                AppointmentClient appointmentClient,
                                ClinicClient clinicClient,
                                PetClient petClient,
                                VeterinarianClient veterinarianClient,
                                AccessGuard accessGuard, NotificationProducer notificationProducer) {
        this.medicalRecordRepository = medicalRecordRepository;
        this.appointmentClient = appointmentClient;
        this.clinicClient = clinicClient;
        this.petClient = petClient;
        this.veterinarianClient = veterinarianClient;
        this.accessGuard = accessGuard;
        this.notificationProducer = notificationProducer;
    }

    public UUID addMedicalRecord(RegisterMedicalRecord request, Jwt jwt) {
        accessGuard.requireRole(jwt, "VETERINARIAN", "ADMIN");

        AppointmentMedical appointment = appointmentClient.checkAppointmentExists(
                request.getAppointmentId()
        );

        if (!accessGuard.isAdmin(jwt)) {
            UUID vetUserId = veterinarianClient.getVeterinarianUserId(
                    appointment.getVeterinarianId()
            );
            accessGuard.requireOwnerOrAdmin(vetUserId, jwt);
        }

        if (!"CONFIRMED".equals(appointment.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Fișa medicală poate fi creată doar pentru o programare CONFIRMED."
            );
        }

        if (appointment.getStartOfAppointment().isAfter(LocalDateTime.now(ZoneId.of("Europe/Bucharest")))) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Consultația nu a început încă."
            );
        }

        if (medicalRecordRepository.existsByAppointmentId(request.getAppointmentId())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Există deja o fișă medicală pentru această programare."
            );
        }

        if (appointment.getVetServiceId() == null) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Programarea nu are un serviciu veterinar asociat."
            );
        }

        UUID clinicId = clinicClient.checkServiceForVeterinarian(
                appointment.getVeterinarianId(),
                appointment.getVetServiceId()
        );

        MedicalRecord record = new MedicalRecord();

        record.setPetId(appointment.getPetId());
        record.setAppointmentId(appointment.getId());
        record.setVeterinarianId(appointment.getVeterinarianId());
        record.setVetServiceId(appointment.getVetServiceId());
        record.setClinicId(clinicId);

        record.setConsultationDate(LocalDateTime.now());
        record.setSymptoms(request.getSymptoms());
        record.setDiagnosis(request.getDiagnosis());
        record.setObservations(request.getObservations());
        record.setWeight(request.getWeight());
        record.setTemperature(request.getTemperature());

        MedicalRecord saved = medicalRecordRepository.save(record);

        try {
            appointmentClient.finishAppointment(appointment.getId());
        } catch (RuntimeException e) {
            medicalRecordRepository.delete(saved);
            throw e;
        }

        PetPublic pet = petClient.getPetById(appointment.getPetId());
        notificationProducer.send(new NotificationEvent(appointment.getOwnerId(), "MEDICAL_RECORD_ADDED", "New medical record", "A new medical record was added for " + pet.getName() + ".", saved.getId()));

        return saved.getId();
    }

    public List<MedicalRecord> getAllMedicalRecords(Jwt jwt) {
        accessGuard.requireAdmin(jwt);
        return medicalRecordRepository.findAll();
    }

    public MedicalRecord getMedicalRecordById(UUID id, Jwt jwt) {
        MedicalRecord record = findOrThrow(id);
        requireAccessToRecord(record, jwt);
        return record;
    }

    public List<MedicalRecord> getMedicalRecordsByPetId(UUID petId, Jwt jwt) {
        PetPublic pet = petClient.getPetById(petId);

        accessGuard.requireOwnerOrAdmin(pet.getOwnerID(), jwt);

        return medicalRecordRepository.findByPetIdOrderByConsultationDateDesc(petId);
    }

    public MedicalRecord getMedicalRecordByAppointmentId(UUID appointmentId, Jwt jwt) {
        MedicalRecord record = medicalRecordRepository.findByAppointmentId(appointmentId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Nu exista o fisa medicala pentru programarea cu ID-ul " + appointmentId
                ));
        requireAccessToRecord(record, jwt);
        return record;
    }

    public void updateMedicalRecord(UUID id, MedicalRecord medicalRecord, Jwt jwt) {
        MedicalRecord existingMedicalRecord = findOrThrow(id);

        accessGuard.requireRole(jwt, "VETERINARIAN", "ADMIN");
        if (!accessGuard.isAdmin(jwt)) {
            UUID vetUserId = veterinarianClient.getVeterinarianUserId(existingMedicalRecord.getVeterinarianId());
            accessGuard.requireOwnerOrAdmin(vetUserId, jwt);
        }

        if (medicalRecord.getConsultationDate() != null) {
            existingMedicalRecord.setConsultationDate(medicalRecord.getConsultationDate());
        }
        if (medicalRecord.getSymptoms() != null) {
            existingMedicalRecord.setSymptoms(medicalRecord.getSymptoms());
        }
        if (medicalRecord.getDiagnosis() != null) {
            existingMedicalRecord.setDiagnosis(medicalRecord.getDiagnosis());
        }
        if (medicalRecord.getObservations() != null) {
            existingMedicalRecord.setObservations(medicalRecord.getObservations());
        }
        if (medicalRecord.getWeight() != null) {
            existingMedicalRecord.setWeight(medicalRecord.getWeight());
        }
        if (medicalRecord.getTemperature() != null) {
            existingMedicalRecord.setTemperature(medicalRecord.getTemperature());
        }

        medicalRecordRepository.save(existingMedicalRecord);
    }

    public void deleteMedicalRecord(UUID id, Jwt jwt) {
        accessGuard.requireAdmin(jwt);

        if (!medicalRecordRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Fisa medicala cu ID-ul " + id + " nu a fost gasita!");
        }

        medicalRecordRepository.deleteById(id);
    }

    private MedicalRecord findOrThrow(UUID id) {
        return medicalRecordRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Fisa medicala cu ID-ul " + id + " nu a fost gasita!"));
    }

    private void requireAccessToRecord(MedicalRecord record, Jwt jwt) {
        PetPublic pet = petClient.getPetById(record.getPetId());
        UUID vetUserId = veterinarianClient.getVeterinarianUserId(record.getVeterinarianId());
        accessGuard.requireOneOfOrAdmin(jwt, pet.getOwnerID(), vetUserId);
    }

    public List<MedicalRecord> getMedicalRecordsForVeterinarian(
            UUID petId,
            UUID appointmentId,
            Jwt jwt
    ) {
        accessGuard.requireRole(jwt, "VETERINARIAN", "ADMIN");

        AppointmentMedical appointment =
                appointmentClient.checkAppointmentExists(appointmentId);

        if (!appointment.getPetId().equals(petId)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Programarea nu aparține acestui animal."
            );
        }

        if (!accessGuard.isAdmin(jwt)) {
            UUID vetUserId = veterinarianClient.getVeterinarianUserId(appointment.getVeterinarianId());

            accessGuard.requireOwnerOrAdmin(vetUserId, jwt);
        }

        if ("CANCELED".equals(appointment.getStatus()) ||
                "NO_SHOW".equals(appointment.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Nu poți accesa istoricul medical prin această programare."
            );
        }

        return medicalRecordRepository.findByPetIdOrderByConsultationDateDesc(petId);
    }
}