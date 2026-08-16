package com.vetapp.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "medical_record")
public class MedicalRecord {

    @Id
    @GeneratedValue
    @UuidGenerator
    @JdbcTypeCode(SqlTypes.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @JdbcTypeCode(SqlTypes.UUID)
    @Column(name = "pet_id", nullable = false)
    private UUID petId;

    @JdbcTypeCode(SqlTypes.UUID)
    @Column(name = "appointment_id", nullable = false, unique = true)
    private UUID appointmentId;

    @JdbcTypeCode(SqlTypes.UUID)
    @Column(name = "veterinarian_id", nullable = false)
    private UUID veterinarianId;

    @Column(name = "consultation_date", nullable = false)
    private LocalDateTime consultationDate;

    @Column(name = "vetServiceId", unique = false, nullable = false)
    private Long vetServiceId;

    @Column(name = "clinicId", nullable = false)
    private UUID clinicId;

    @Column(name = "symptoms")
    private String symptoms;

    @Column(name = "diagnosis")
    private String diagnosis;

    @Column(name = "observations")
    private String observations;

    @Column(name = "weight")
    private Double weight;

    @Column(name = "temperature")
    private Double temperature;

    public MedicalRecord() {
    }

    public MedicalRecord(UUID id, UUID petId, UUID appointmentId, UUID veterinarianId, LocalDateTime consultationDate, Long vetServiceId, UUID clinicId, String symptoms, String diagnosis, String observations, Double weight, Double temperature) {
        this.id = id;
        this.petId = petId;
        this.appointmentId = appointmentId;
        this.veterinarianId = veterinarianId;
        this.consultationDate = consultationDate;
        this.vetServiceId = vetServiceId;
        this.clinicId = clinicId;
        this.symptoms = symptoms;
        this.diagnosis = diagnosis;
        this.observations = observations;
        this.weight = weight;
        this.temperature = temperature;
    }

    public UUID getClinicId() {
        return clinicId;
    }

    public void setClinicId(UUID clinicId) {
        this.clinicId = clinicId;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getPetId() {
        return petId;
    }

    public void setPetId(UUID petId) {
        this.petId = petId;
    }

    public UUID getAppointmentId() {
        return appointmentId;
    }

    public void setAppointmentId(UUID appointmentId) {
        this.appointmentId = appointmentId;
    }

    public UUID getVeterinarianId() {
        return veterinarianId;
    }

    public void setVeterinarianId(UUID veterinarianId) {
        this.veterinarianId = veterinarianId;
    }

    public LocalDateTime getConsultationDate() {
        return consultationDate;
    }

    public void setConsultationDate(LocalDateTime consultationDate) {
        this.consultationDate = consultationDate;
    }

    public String getSymptoms() {
        return symptoms;
    }

    public void setSymptoms(String symptoms) {
        this.symptoms = symptoms;
    }

    public String getDiagnosis() {
        return diagnosis;
    }

    public void setDiagnosis(String diagnosis) {
        this.diagnosis = diagnosis;
    }

    public String getObservations() {
        return observations;
    }

    public void setObservations(String observations) {
        this.observations = observations;
    }

    public Double getWeight() {
        return weight;
    }

    public void setWeight(Double weight) {
        this.weight = weight;
    }

    public Double getTemperature() {
        return temperature;
    }

    public void setTemperature(Double temperature) {
        this.temperature = temperature;
    }

    public Long getVetServiceId() {
        return vetServiceId;
    }

    public void setVetServiceId(Long vetServiceId) {
        this.vetServiceId = vetServiceId;
    }
}