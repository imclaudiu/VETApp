package com.vetapp.DTO;

import com.vetapp.entity.Status;
import jakarta.persistence.Column;

import java.util.UUID;

public class RegisterMedicalRecord {
    private UUID appointmentId;
    private String symptoms;
    private String diagnosis;
    private String observations;
    private Double weight;
    private Double temperature;
    private Status status;

    public RegisterMedicalRecord() {
    }

    public RegisterMedicalRecord(UUID appointmentId, String symptoms, String diagnosis, String observations, Double weight, Double temperature, Status status) {
        this.appointmentId = appointmentId;
        this.symptoms = symptoms;
        this.diagnosis = diagnosis;
        this.observations = observations;
        this.weight = weight;
        this.temperature = temperature;
        this.status = status;
    }

    public UUID getAppointmentId() {
        return appointmentId;
    }

    public void setAppointmentId(UUID appointmentId) {
        this.appointmentId = appointmentId;
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

    public Status getStatus() {
        return status;
    }

    public void setStatus(Status status) {
        this.status = status;
    }
}
