package com.vetapp.DTO;

import java.time.LocalDateTime;
import java.util.UUID;

public class AppointmentMedical {    private UUID id;
    private UUID petId;
    private UUID ownerId;
    private UUID veterinarianId;
    private LocalDateTime startOfAppointment;
    private LocalDateTime endOfAppointment;
    private String status;

    public AppointmentMedical() {
    }

    public AppointmentMedical(UUID id, UUID petId, UUID ownerId, UUID veterinarianId, LocalDateTime startOfAppointment, LocalDateTime endOfAppointment, String status) {
        this.id = id;
        this.petId = petId;
        this.ownerId = ownerId;
        this.veterinarianId = veterinarianId;
        this.startOfAppointment = startOfAppointment;
        this.endOfAppointment = endOfAppointment;
        this.status = status;
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

    public UUID getOwnerId() {
        return ownerId;
    }

    public void setOwnerId(UUID ownerId) {
        this.ownerId = ownerId;
    }

    public UUID getVeterinarianId() {
        return veterinarianId;
    }

    public void setVeterinarianId(UUID veterinarianId) {
        this.veterinarianId = veterinarianId;
    }

    public LocalDateTime getStartOfAppointment() {
        return startOfAppointment;
    }

    public void setStartOfAppointment(LocalDateTime startOfAppointment) {
        this.startOfAppointment = startOfAppointment;
    }

    public LocalDateTime getEndOfAppointment() {
        return endOfAppointment;
    }

    public void setEndOfAppointment(LocalDateTime endOfAppointment) {
        this.endOfAppointment = endOfAppointment;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
