package com.vetapp.controller;

import com.vetapp.entity.Clinic;
import com.vetapp.service.ClinicService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@Validated
@RequestMapping("/clinic")
public class ClinicController {

    private final ClinicService clinicService;

    public ClinicController(ClinicService clinicService) {
        this.clinicService = clinicService;
    }

    @PostMapping("/add")
    public ResponseEntity<UUID> addClinic(@RequestBody Clinic clinic) {
        UUID id = clinicService.addClinic(clinic);
        return ResponseEntity.status(HttpStatus.CREATED).body(id);
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<Clinic>> getAllClinics() {
        return ResponseEntity.ok(clinicService.getAllClinics());
    }

    @GetMapping("/findByCity/{city}")
    public ResponseEntity<List<Clinic>> getClinicsByCity(@PathVariable String city){
        return ResponseEntity.ok(clinicService.getClinicsByCity(city));
    }


    @GetMapping("/get/{id}")
    public ResponseEntity<Clinic> getClinicById(@PathVariable UUID id) {
        return ResponseEntity.ok(clinicService.getClinicById(id));
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<Clinic> updateClinic(
            @PathVariable UUID id,
            @RequestBody Clinic updatedClinic) {

        return ResponseEntity.ok(
                clinicService.updateClinic(id, updatedClinic)
        );
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> deleteClinic(@PathVariable UUID id) {
        clinicService.deleteClinic(id);
        return ResponseEntity.ok().build();
    }
}