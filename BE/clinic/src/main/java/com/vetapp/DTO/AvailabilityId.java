package com.vetapp.DTO;

import jakarta.persistence.Embeddable;
import jakarta.persistence.Temporal;
import jakarta.persistence.TemporalType;

import java.io.Serializable;
import java.time.LocalDate;
import java.util.Date;
import java.util.Objects;
import java.util.UUID;

@Embeddable
public class AvailabilityId implements Serializable {

    private UUID veterinarianId;

    @Temporal(TemporalType.DATE)
    private LocalDate day;

    public AvailabilityId() {
    }

    public AvailabilityId(UUID veterinarianId, LocalDate day) {
        this.veterinarianId = veterinarianId;
        this.day = day;
    }

    public UUID getVeterinarianId() {
        return veterinarianId;
    }

    public void setVeterinarianId(UUID veterinarianId) {
        this.veterinarianId = veterinarianId;
    }

    public LocalDate getDay() {
        return day;
    }

    public void setDay(LocalDate day) {
        this.day = day;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof AvailabilityId)) return false;

        AvailabilityId that = (AvailabilityId) o;

        return Objects.equals(veterinarianId, that.veterinarianId)
                && Objects.equals(day, that.day);
    }

    @Override
    public int hashCode() {
        return Objects.hash(veterinarianId, day);
    }
}