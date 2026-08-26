package com.vetapp.controller;

import com.vetapp.DTO.builder.AppointmentPublic;
import com.vetapp.entity.Appointment;
import com.vetapp.service.AppointmentService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
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
    public ResponseEntity<UUID> addAppointment(@RequestBody AppointmentPublic appointment, @AuthenticationPrincipal Jwt jwt) {
        UUID id = appointmentService.addAppointment(appointment, jwt);
        return ResponseEntity.status(HttpStatus.CREATED).body(id);
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<Appointment>> getAll(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(appointmentService.getAllAppointments(jwt));
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<Appointment> getById(@PathVariable UUID id, @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(appointmentService.getAppointmentById(id, jwt));
    }

    @GetMapping("/owner/{ownerId}")
    public ResponseEntity<List<Appointment>> getByOwnerId(@PathVariable UUID ownerId, @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(appointmentService.getAppointmentsByOwnerId(ownerId, jwt));
    }

    @GetMapping("/pet/{petId}")
    public ResponseEntity<List<Appointment>> getByPetId(@PathVariable UUID petId, @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(appointmentService.getAppointmentsByPetId(petId, jwt));
    }

    @GetMapping("/veterinarian/{veterinarianId}")
    public ResponseEntity<List<Appointment>> getByVeterinarianId(@PathVariable UUID veterinarianId, @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(appointmentService.getAppointmentsByVeterinarianId(veterinarianId, jwt));
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<Appointment> updateAppointment(@PathVariable UUID id,
                                                         @RequestBody Appointment updatedAppointment,
                                                         @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(appointmentService.updateAppointment(id, updatedAppointment, jwt));
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> deleteAppointment(@PathVariable UUID id, @AuthenticationPrincipal Jwt jwt) {
        appointmentService.deleteAppointment(id, jwt);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/available-slots")
    public ResponseEntity<List<LocalDateTime>> getAvailableSlots(@RequestParam UUID veterinarianId, @RequestParam Long vetServiceId, @RequestParam LocalDate day) {
        return ResponseEntity.ok(appointmentService.getAvailableSlots(veterinarianId, vetServiceId, day));
    }

    @PatchMapping("/cancel/{id}")
    public ResponseEntity<Appointment> cancelAppointment(@PathVariable UUID id, @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(appointmentService.cancelAppointment(id, jwt));
    }
}