package com.vetapp.controller;

import com.vetapp.entity.Clinic;
import com.vetapp.service.ClinicService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/clinic")
public class ClinicController {

    private final ClinicService clinicService;

    public ClinicController(ClinicService clinicService) {
        this.clinicService = clinicService;
    }

    @PostMapping("/add")
    public ResponseEntity<UUID> addClinic(@RequestBody Clinic clinic, @AuthenticationPrincipal Jwt jwt) {
        UUID id = clinicService.addClinic(clinic, jwt);
        return ResponseEntity.status(HttpStatus.CREATED).body(id);
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<Clinic>> getAll() {
        return ResponseEntity.ok(clinicService.getAllClinics());
    }

    @GetMapping("/city/{city}")
    public ResponseEntity<List<Clinic>> getByCity(@PathVariable String city) {
        return ResponseEntity.ok(clinicService.getClinicsByCity(city));
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<Clinic> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(clinicService.getClinicById(id));
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<Clinic> updateClinic(@PathVariable UUID id,
                                               @RequestBody Clinic updatedClinic,
                                               @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(clinicService.updateClinic(id, updatedClinic, jwt));
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> deleteClinic(@PathVariable UUID id, @AuthenticationPrincipal Jwt jwt) {
        clinicService.deleteClinic(id, jwt);
        return ResponseEntity.noContent().build();
    }
}