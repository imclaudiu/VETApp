package com.vetapp.service;

import com.vetapp.DTO.AppointmentMedical;
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
import java.util.List;
import java.util.UUID;

@Service
public class MedicalRecordService {

    private final MedicalRecordRepository medicalRecordRepository;
    private final AppointmentClient appointmentClient;
    private final ClinicClient clinicClient;
    private final PetClient petClient;
    private final VeterinarianClient veterinarianClient; // NOU
    private final AccessGuard accessGuard;

    public MedicalRecordService(MedicalRecordRepository medicalRecordRepository,
                                AppointmentClient appointmentClient,
                                ClinicClient clinicClient,
                                PetClient petClient,
                                VeterinarianClient veterinarianClient,
                                AccessGuard accessGuard) {
        this.medicalRecordRepository = medicalRecordRepository;
        this.appointmentClient = appointmentClient;
        this.clinicClient = clinicClient;
        this.petClient = petClient;
        this.veterinarianClient = veterinarianClient;
        this.accessGuard = accessGuard;
    }

    public UUID addMedicalRecord(RegisterMedicalRecord registerMedicalRecord, Jwt jwt) {
        accessGuard.requireRole(jwt, "VETERINARIAN", "ADMIN");

        AppointmentMedical appointmentMedical = appointmentClient.checkAppointmentExists(registerMedicalRecord.getAppointmentId());

        // FIX: verificam ca veterinarul e chiar cel asignat programarii (daca nu e admin)
        if (!accessGuard.isAdmin(jwt)) {
            UUID vetUserId = veterinarianClient.getVeterinarianUserId(appointmentMedical.getVeterinarianId());
            accessGuard.requireOwnerOrAdmin(vetUserId, jwt);
        }

        if ("CANCELED".equals(appointmentMedical.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Nu se poate crea o fisa medicala pentru o programare anulata!");
        }

        if (medicalRecordRepository.existsByAppointmentId(registerMedicalRecord.getAppointmentId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Exista deja o fisa medicala pentru aceasta programare!");
        }

        MedicalRecord medicalRecord = new MedicalRecord();
        medicalRecord.setPetId(appointmentMedical.getPetId());
        medicalRecord.setAppointmentId(registerMedicalRecord.getAppointmentId());
        medicalRecord.setVeterinarianId(appointmentMedical.getVeterinarianId());

        UUID clinicId = clinicClient.checkServiceForVeterinarian(
                appointmentMedical.getVeterinarianId(),
                registerMedicalRecord.getVetServiceId()
        );
        medicalRecord.setClinicId(clinicId);
        medicalRecord.setVetServiceId(registerMedicalRecord.getVetServiceId());
        medicalRecord.setConsultationDate(LocalDateTime.now());
        medicalRecord.setSymptoms(registerMedicalRecord.getSymptoms());
        medicalRecord.setDiagnosis(registerMedicalRecord.getDiagnosis());
        medicalRecord.setObservations(registerMedicalRecord.getObservations());
        medicalRecord.setWeight(registerMedicalRecord.getWeight());
        medicalRecord.setTemperature(registerMedicalRecord.getTemperature());

        MedicalRecord savedMedicalRecord = medicalRecordRepository.save(medicalRecord);
        return savedMedicalRecord.getId();
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
        // owner-ul pet-ului SAU orice veterinar SAU admin - istoricul medical il vede vetul care trateaza animalul
        if (!accessGuard.isAdmin(jwt) && !"VETERINARIAN".equals(accessGuard.extractRole(jwt))) {
            accessGuard.requireOwnerOrAdmin(pet.getOwnerID(), jwt);
        }
        return medicalRecordRepository.findByPetId(petId);
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

    // FIX: acum verifica real - owner-ul pet-ului SAU veterinarul asignat SAU admin
    private void requireAccessToRecord(MedicalRecord record, Jwt jwt) {
        PetPublic pet = petClient.getPetById(record.getPetId());
        UUID vetUserId = veterinarianClient.getVeterinarianUserId(record.getVeterinarianId());
        accessGuard.requireOneOfOrAdmin(jwt, pet.getOwnerID(), vetUserId);
    }
}