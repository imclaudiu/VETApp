package com.vetapp.controller;

import com.vetapp.DTO.VeterinarianPublic;
import com.vetapp.entity.Veterinarian;
import com.vetapp.service.VeterinarianService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/vet")
public class VeterinarianController {

    private final VeterinarianService veterinarianService;

    public VeterinarianController(VeterinarianService veterinarianService) {
        this.veterinarianService = veterinarianService;
    }

    @PostMapping("/add")
    public ResponseEntity<UUID> addVeterinarian(@RequestBody Veterinarian veterinarian, @AuthenticationPrincipal Jwt jwt) {
        UUID id = veterinarianService.addVeterinarian(veterinarian, jwt);
        return ResponseEntity.status(HttpStatus.CREATED).body(id);
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<Veterinarian>> getAll() {
        return ResponseEntity.ok(veterinarianService.getAllVeterinarians());
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<VeterinarianPublic> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(veterinarianService.getVeterinarianById(id));
    }

    @GetMapping("/clinic/{clinicId}")
    public ResponseEntity<List<VeterinarianPublic>> getByClinicId(@PathVariable UUID clinicId) {
        return ResponseEntity.ok(veterinarianService.getVeterinariansByClinicId(clinicId));
    }

    @GetMapping("/{id}/clinicId")
    public ResponseEntity<UUID> getClinicId(@PathVariable UUID id) {
        return ResponseEntity.ok(veterinarianService.getVeterinarianClinicId(id));
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<Veterinarian> updateVeterinarian(@PathVariable UUID id,
                                                           @RequestBody Veterinarian updatedVeterinarian,
                                                           @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(veterinarianService.updateVeterinarian(id, updatedVeterinarian, jwt));
    }

    // VeterinarianController.java (in clinic)
    @GetMapping("/{id}/userId")
    public ResponseEntity<UUID> getUserId(@PathVariable UUID id) {
        return ResponseEntity.ok(veterinarianService.getVeterinarianUserId(id));
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> deleteVeterinarian(@PathVariable UUID id, @AuthenticationPrincipal Jwt jwt) {
        veterinarianService.deleteVeterinarian(id, jwt);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    public ResponseEntity<VeterinarianPublic> getMyVeterinarian(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(veterinarianService.getMyVeterinarian(jwt));
    }
}