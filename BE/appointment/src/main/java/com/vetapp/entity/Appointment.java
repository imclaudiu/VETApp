package com.vetapp.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
public class Appointment {
    @Id
    @GeneratedValue
    @UuidGenerator
    @JdbcTypeCode(SqlTypes.UUID)
    private UUID id;

    @Column(name = "ownerId", unique = false, nullable = false)
    private UUID ownerId;
    @Column(name = "petId", unique = false, nullable = false)
    private UUID petId;
    @Column(name = "veterinarianId", unique = false, nullable = false)
    private UUID veterinarianId;
    @Column(name = "vetServiceId", unique = false, nullable = false)
    private Long vetServiceId;
    @Column(name = "startOfAppointment", unique = false, nullable = false)
    private LocalDateTime startOfAppointment;
    @Column(name = "endOfAppointment", unique = false, nullable = false)
    private LocalDateTime endOfAppointment;
    @Column(name = "serviceName", unique = false, nullable = false)
    private String serviceName;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", unique = false, nullable = false)
    private Status status;

    public Appointment() {
    }

    public Appointment(UUID id, UUID ownerId, UUID petId, UUID veterinarianId, Long vetServiceId, LocalDateTime startOfAppointment, LocalDateTime endOfAppointment, String serviceName, Status status) {
        this.id = id;
        this.ownerId = ownerId;
        this.petId = petId;
        this.veterinarianId = veterinarianId;
        this.vetServiceId = vetServiceId;
        this.startOfAppointment = startOfAppointment;
        this.endOfAppointment = endOfAppointment;
        this.serviceName = serviceName;
        this.status = status;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getOwnerId() {
        return ownerId;
    }

    public void setOwnerId(UUID ownerId) {
        this.ownerId = ownerId;
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

    public LocalDateTime getEndOfAppointment() {
        return endOfAppointment;
    }

    public void setEndOfAppointment(LocalDateTime endOfAppointment) {
        this.endOfAppointment = endOfAppointment;
    }

    public String getServiceName() {
        return serviceName;
    }

    public void setServiceName(String serviceName) {
        this.serviceName = serviceName;
    }

    public Status getStatus() {
        return status;
    }

    public void setStatus(Status status) {
        this.status = status;
    }
}
