package com.vetapp.DTO.builder;

import java.time.LocalDateTime;
import java.util.UUID;

public class AppointmentPublic {

    private UUID petId;
    private UUID veterinarianId;
    private Long vetServiceId;
    private LocalDateTime startOfAppointment;

    public AppointmentPublic() {
    }

    public AppointmentPublic(
            UUID petId,
            UUID veterinarianId,
            Long vetServiceId,
            LocalDateTime startOfAppointment
    ) {
        this.petId = petId;
        this.veterinarianId = veterinarianId;
        this.vetServiceId = vetServiceId;
        this.startOfAppointment = startOfAppointment;
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

    public Long getVetServiceId() {
        return vetServiceId;
    }

    public void setVetServiceId(Long vetServiceId) {
        this.vetServiceId = vetServiceId;
    }

    public LocalDateTime getStartOfAppointment() {
        return startOfAppointment;
    }

    public void setStartOfAppointment(LocalDateTime startOfAppointment) {
        this.startOfAppointment = startOfAppointment;
    }
}