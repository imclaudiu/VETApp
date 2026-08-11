package com.vetapp.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.type.SqlTypes;

import java.util.UUID;

@Entity
public class Veterinarian {
    @Id
    @GeneratedValue
    @UuidGenerator
    @JdbcTypeCode(SqlTypes.UUID)
    private UUID id;

    @Column(name = "userId", unique = true, nullable = false)
    private UUID userId;
    @Column(name = "clinicID", unique = false, nullable = false)
    private UUID clinicId;
    @Column(name = "surgeon", unique = false, nullable = false)
    private Boolean surgeon;

    public Veterinarian() {
    }

    public Veterinarian(UUID id, UUID userId, UUID clinicId, Boolean surgeon) {
        this.id = id;
        this.userId = userId;
        this.clinicId = clinicId;
        this.surgeon = surgeon;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public UUID getClinicId() {
        return clinicId;
    }

    public void setClinicId(UUID clinicId) {
        this.clinicId = clinicId;
    }

    public Boolean getSurgeon() {
        return surgeon;
    }

    public void setSurgeon(Boolean surgeon) {
        this.surgeon = surgeon;
    }
}
