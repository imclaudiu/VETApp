package com.vetapp.DTO.builder;

import com.vetapp.entity.Status;
import jakarta.persistence.Column;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;

import java.time.LocalDateTime;
import java.util.UUID;

public class AppointmentPublic {
    private UUID petId;
    private UUID veterinarianId;
    private LocalDateTime startOfAppointment;
    private LocalDateTime endOfAppointment;

    public AppointmentPublic() {
    }

    public AppointmentPublic(UUID petId, UUID veterinarianId, LocalDateTime startOfAppointment, LocalDateTime endOfAppointment) {
        this.petId = petId;
        this.veterinarianId = veterinarianId;
        this.startOfAppointment = startOfAppointment;
        this.endOfAppointment = endOfAppointment;
    }

    public UUID getPetId() {
        return petId;
    }

    public void setPetId(UUID petId) {
        this.petId = petId;
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
}
