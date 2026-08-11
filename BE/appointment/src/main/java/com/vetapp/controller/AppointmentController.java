package com.vetapp.controller;

import com.vetapp.entity.Appointment;
import com.vetapp.service.AppointmentService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/appointment")
public class AppointmentController {

    private final AppointmentService appointmentService;

    public AppointmentController(AppointmentService appointmentService) {
        this.appointmentService = appointmentService;
    }

    @PostMapping("/add")
    public ResponseEntity<UUID> addAppointment(
            @RequestBody Appointment appointment) {

        UUID id = appointmentService.addAppointment(appointment);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(id);
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<Appointment>> getAllAppointments() {

        return ResponseEntity.ok(
                appointmentService.getAllAppointments()
        );
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<Appointment> getAppointmentById(
            @PathVariable UUID id) {

        return ResponseEntity.ok(
                appointmentService.getAppointmentById(id)
        );
    }

    @GetMapping("/findByOwner/{ownerId}")
    public ResponseEntity<List<Appointment>> getAppointmentsByOwnerId(
            @PathVariable UUID ownerId) {

        return ResponseEntity.ok(
                appointmentService.getAppointmentsByOwnerId(ownerId)
        );
    }

    @GetMapping("/findByPet/{petId}")
    public ResponseEntity<List<Appointment>> getAppointmentsByPetId(
            @PathVariable UUID petId) {

        return ResponseEntity.ok(
                appointmentService.getAppointmentsByPetId(petId)
        );
    }

    @GetMapping("/findByVeterinarian/{veterinarianId}")
    public ResponseEntity<List<Appointment>> getAppointmentsByVeterinarianId(
            @PathVariable UUID veterinarianId) {

        return ResponseEntity.ok(
                appointmentService.getAppointmentsByVeterinarianId(veterinarianId)
        );
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<Appointment> updateAppointment(
            @PathVariable UUID id,
            @RequestBody Appointment updatedAppointment) {

        return ResponseEntity.ok(
                appointmentService.updateAppointment(id, updatedAppointment)
        );
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> deleteAppointment(
            @PathVariable UUID id) {

        appointmentService.deleteAppointment(id);

        return ResponseEntity.ok().build();
    }
}