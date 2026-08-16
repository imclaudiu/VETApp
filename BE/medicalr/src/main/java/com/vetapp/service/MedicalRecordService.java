package com.vetapp.service;

import com.vetapp.DTO.AppointmentMedical;
import com.vetapp.DTO.RegisterMedicalRecord;
import com.vetapp.client.AppointmentClient;
import com.vetapp.client.ClinicClient;
import com.vetapp.entity.MedicalRecord;
import com.vetapp.repository.MedicalRecordRepository;
import org.springframework.http.HttpStatus;
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

    public MedicalRecordService(MedicalRecordRepository medicalRecordRepository, AppointmentClient appointmentClient, ClinicClient clinicClient) {
        this.medicalRecordRepository = medicalRecordRepository;
        this.appointmentClient = appointmentClient;
        this.clinicClient = clinicClient;
    }

    public UUID addMedicalRecord(RegisterMedicalRecord registerMedicalRecord) {

        AppointmentMedical appointmentMedical = appointmentClient.checkAppointmentExists(registerMedicalRecord.getAppointmentId());

        if ("CANCELED".equals(appointmentMedical.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Nu se poate crea o fisa medicala pentru o programare anulata!"
            );
        }

        if (medicalRecordRepository.existsByAppointmentId(registerMedicalRecord.getAppointmentId())){
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Exista deja o fisa medicala pentru aceasta programare!"
            );
        }



        MedicalRecord medicalRecord = new MedicalRecord();

        medicalRecord.setPetId(appointmentMedical.getPetId());
        medicalRecord.setAppointmentId(registerMedicalRecord.getAppointmentId());
        medicalRecord.setVeterinarianId(appointmentMedical.getVeterinarianId());
//        medicalRecord.setClinicId(clinicClient.getClinicId(appointmentMedical.getVeterinarianId()));
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


        MedicalRecord savedMedicalRecord =
                medicalRecordRepository.save(medicalRecord);

        return savedMedicalRecord.getId();
    }

    public List<MedicalRecord> getAllMedicalRecords() {
        return medicalRecordRepository.findAll();
    }

    public MedicalRecord getMedicalRecordById(UUID id) {

        return medicalRecordRepository.findById(id)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Fisa medicala cu ID-ul " + id + " nu a fost gasita!"
                        )
                );
    }

    public List<MedicalRecord> getMedicalRecordsByPetId(UUID petId) {

        return medicalRecordRepository.findByPetId(petId);
    }

    public MedicalRecord getMedicalRecordByAppointmentId(UUID appointmentId) {

        return medicalRecordRepository.findByAppointmentId(appointmentId)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Nu exista o fisa medicala pentru programarea cu ID-ul "
                                        + appointmentId
                        )
                );
    }

    public void updateMedicalRecord(UUID id, MedicalRecord medicalRecord) {

        MedicalRecord existingMedicalRecord =
                medicalRecordRepository.findById(id)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Fisa medicala cu ID-ul " + id + " nu a fost gasita!"
                                )
                        );

        if (medicalRecord.getConsultationDate() != null) {
            existingMedicalRecord.setConsultationDate(
                    medicalRecord.getConsultationDate()
            );
        }

        if (medicalRecord.getSymptoms() != null) {
            existingMedicalRecord.setSymptoms(
                    medicalRecord.getSymptoms()
            );
        }

        if (medicalRecord.getDiagnosis() != null) {
            existingMedicalRecord.setDiagnosis(
                    medicalRecord.getDiagnosis()
            );
        }

        if (medicalRecord.getObservations() != null) {
            existingMedicalRecord.setObservations(
                    medicalRecord.getObservations()
            );
        }

        if (medicalRecord.getWeight() != null) {
            existingMedicalRecord.setWeight(
                    medicalRecord.getWeight()
            );
        }

        if (medicalRecord.getTemperature() != null) {
            existingMedicalRecord.setTemperature(
                    medicalRecord.getTemperature()
            );
        }

        medicalRecordRepository.save(existingMedicalRecord);
    }

    public void deleteMedicalRecord(UUID id) {

        if (!medicalRecordRepository.existsById(id)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Fisa medicala cu ID-ul " + id + " nu a fost gasita!"
            );
        }

        medicalRecordRepository.deleteById(id);
    }


}