package com.vetapp.DTO.builder;

import java.time.LocalDateTime;
import java.util.UUID;

public class AppointmentMedical {
    private UUID id;
    private UUID petId;
    private UUID ownerId;
    private UUID veterinarianId;
    private LocalDateTime startOfAppointment;
    private LocalDateTime endOfAppointment;
    private String status;

}
