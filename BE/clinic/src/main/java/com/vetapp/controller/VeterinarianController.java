package com.vetapp.controller;

import com.vetapp.DTO.VeterinarianPublic;
import com.vetapp.entity.Veterinarian;
import com.vetapp.service.VeterinarianService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@Validated
@RequestMapping("/vet")
public class VeterinarianController {

    private final VeterinarianService veterinarianService;

    public VeterinarianController(VeterinarianService veterinarianService) {
        this.veterinarianService = veterinarianService;
    }

    @PostMapping("/add")
    public ResponseEntity<UUID> addVeterinarian(@RequestBody Veterinarian veterinarian) {
        UUID id = veterinarianService.addVeterinarian(veterinarian);
        return ResponseEntity.status(HttpStatus.CREATED).body(id);
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<Veterinarian>> getAllVeterinarians() {
        return ResponseEntity.ok(veterinarianService.getAllVeterinarians());
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<VeterinarianPublic> getVeterinarianById(@PathVariable UUID id) {
        return ResponseEntity.ok(veterinarianService.getVeterinarianById(id));
    }

    @GetMapping("/getClinicId/{id}")
    public ResponseEntity<UUID> getClinicById(@PathVariable UUID id){
        return ResponseEntity.ok(veterinarianService.getVeterinarianClinicId(id));
    }

    @GetMapping("/findByClinic/{clinicId}")
    public ResponseEntity<List<Veterinarian>> getVeterinariansByClinicId(
            @PathVariable UUID clinicId) {

        return ResponseEntity.ok(
                veterinarianService.getVeterinariansByClinicId(clinicId)
        );
    }

    @PatchMapping("/update/{id}")
    public ResponseEntity<Veterinarian> updateVeterinarian(
            @PathVariable UUID id,
            @RequestBody Veterinarian updatedVeterinarian) {

        return ResponseEntity.ok(
                veterinarianService.updateVeterinarian(id, updatedVeterinarian)
        );
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> deleteVeterinarian(@PathVariable UUID id) {
        veterinarianService.deleteVeterinarian(id);
        return ResponseEntity.ok().build();
    }
}