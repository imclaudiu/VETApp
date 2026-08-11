package com.vetapp.entity;

import com.vetapp.DTO.AvailabilityId;
import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;

import java.time.LocalTime;

@Entity
public class Availability {

    @EmbeddedId
    private AvailabilityId id;

    @Column(name = "startHour", nullable = false)
    private LocalTime startHour;

    @Column(name = "endHour", nullable = false)
    private LocalTime endHour;

    public Availability() {
    }

    public Availability(
            AvailabilityId id,
            LocalTime startHour,
            LocalTime endHour) {

        this.id = id;
        this.startHour = startHour;
        this.endHour = endHour;
    }

    public AvailabilityId getId() {
        return id;
    }

    public void setId(AvailabilityId id) {
        this.id = id;
    }

    public LocalTime getStartHour() {
        return startHour;
    }

    public void setStartHour(LocalTime startHour) {
        this.startHour = startHour;
    }

    public LocalTime getEndHour() {
        return endHour;
    }

    public void setEndHour(LocalTime endHour) {
        this.endHour = endHour;
    }
}