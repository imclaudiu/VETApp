package com.vetapp.DTO;

import com.vetapp.entity.Status;

import java.time.LocalDateTime;
import java.util.UUID;

public class VeterinarianAppointmentPublic {

    private UUID id;
    private UUID petId;
    private String petName;
    private String species;
    private String race;
    private String sex;
    private Long vetServiceId;
    private String serviceName;
    private LocalDateTime startOfAppointment;
    private LocalDateTime endOfAppointment;
    private Status status;

    public VeterinarianAppointmentPublic() {
    }

    public VeterinarianAppointmentPublic(UUID id, UUID petId, String petName, String species, String race, String sex, Long vetServiceId, String serviceName, LocalDateTime startOfAppointment, LocalDateTime endOfAppointment, Status status) {
        this.id = id;
        this.petId = petId;
        this.petName = petName;
        this.species = species;
        this.race = race;
        this.sex = sex;
        this.vetServiceId = vetServiceId;
        this.serviceName = serviceName;
        this.startOfAppointment = startOfAppointment;
        this.endOfAppointment = endOfAppointment;
        this.status = status;
    }

    public UUID getId() {
        return id;
    }

    public UUID getPetId() {
        return petId;
    }

    public String getPetName() {
        return petName;
    }

    public String getSpecies() {
        return species;
    }

    public String getRace() {
        return race;
    }

    public String getSex() {
        return sex;
    }

    public Long getVetServiceId() {
        return vetServiceId;
    }

    public String getServiceName() {
        return serviceName;
    }

    public LocalDateTime getStartOfAppointment() {
        return startOfAppointment;
    }

    public LocalDateTime getEndOfAppointment() {
        return endOfAppointment;
    }

    public Status getStatus() {
        return status;
    }
}