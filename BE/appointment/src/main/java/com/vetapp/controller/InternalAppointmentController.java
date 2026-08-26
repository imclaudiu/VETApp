package com.vetapp.controller;

import com.vetapp.entity.Appointment;
import com.vetapp.service.AppointmentService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@RestController
@RequestMapping("/appointment/internal")
public class InternalAppointmentController {

    private final AppointmentService appointmentService;
    private final String internalApiKey;

    public InternalAppointmentController(AppointmentService appointmentService,
                                         @Value("${INTERNAL_API_KEY}") String internalApiKey) {
        this.appointmentService = appointmentService;
        this.internalApiKey = internalApiKey;
    }

    private void checkKey(String key) {
        if (!internalApiKey.equals(key)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Invalid internal service key.");
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Appointment> getAppointment(@PathVariable UUID id,
                                                      @RequestHeader("X-Internal-Key") String key) {
        checkKey(key);
        return ResponseEntity.ok(appointmentService.getAppointmentInternal(id));
    }

    @PatchMapping("/{id}/finish")
    public ResponseEntity<Void> finishAppointment(@PathVariable UUID id,
                                                  @RequestHeader("X-Internal-Key") String key) {
        checkKey(key);
        appointmentService.finishAppointmentInternal(id);
        return ResponseEntity.noContent().build();
    }
}