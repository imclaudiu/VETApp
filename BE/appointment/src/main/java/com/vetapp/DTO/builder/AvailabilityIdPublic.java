package com.vetapp.DTO.builder;

import java.time.LocalDate;
import java.util.UUID;

public class AvailabilityIdPublic {

    private UUID veterinarianId;
    private LocalDate day;

    public AvailabilityIdPublic() {
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
}