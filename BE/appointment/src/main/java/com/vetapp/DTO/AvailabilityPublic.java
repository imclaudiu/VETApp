package com.vetapp.DTO;

import java.time.LocalTime;

public class AvailabilityPublic {

    private AvailabilityIdPublic id;
    private LocalTime startHour;
    private LocalTime endHour;

    public AvailabilityPublic() {
    }

    public AvailabilityIdPublic getId() {
        return id;
    }

    public void setId(AvailabilityIdPublic id) {
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