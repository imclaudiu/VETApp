package com.vetapp.controller;

import com.vetapp.DTO.RegisterMedicalRecord;
import com.vetapp.entity.MedicalRecord;
import com.vetapp.service.MedicalRecordService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/medicalr")
public class MedicalRecordController {

    private final MedicalRecordService medicalRecordService;

    public MedicalRecordController(MedicalRecordService medicalRecordService) {
        this.medicalRecordService = medicalRecordService;
    }

    @PostMapping("/add")
    public ResponseEntity<UUID> addMedicalRecord(@RequestBody RegisterMedicalRecord registerMedicalRecord, @AuthenticationPrincipal Jwt jwt) {
        UUID id = medicalRecordService.addMedicalRecord(registerMedicalRecord, jwt);
        return ResponseEntity.status(HttpStatus.CREATED).body(id);
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<MedicalRecord>> getAll(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(medicalRecordService.getAllMedicalRecords(jwt));
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<MedicalRecord> getById(@PathVariable UUID id, @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(medicalRecordService.getMedicalRecordById(id, jwt));
    }

    @GetMapping("/pet/{petId}")
    public ResponseEntity<List<MedicalRecord>> getByPetId(@PathVariable UUID petId, @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(medicalRecordService.getMedicalRecordsByPetId(petId, jwt));
    }

    @GetMapping("/appointment/{appointmentId}")
    public ResponseEntity<MedicalRecord> getByAppointmentId(@PathVariable UUID appointmentId, @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(medicalRecordService.getMedicalRecordByAppointmentId(appointmentId, jwt));
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<Void> updateMedicalRecord(@PathVariable UUID id,
                                                    @RequestBody MedicalRecord medicalRecord,
                                                    @AuthenticationPrincipal Jwt jwt) {
        medicalRecordService.updateMedicalRecord(id, medicalRecord, jwt);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> deleteMedicalRecord(@PathVariable UUID id, @AuthenticationPrincipal Jwt jwt) {
        medicalRecordService.deleteMedicalRecord(id, jwt);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/pet/{petId}/appointment/{appointmentId}")
    public ResponseEntity<List<MedicalRecord>> getPetHistoryForVeterinarian (@PathVariable UUID petId, @PathVariable UUID appointmentId, @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(medicalRecordService.getMedicalRecordsForVeterinarian(petId, appointmentId, jwt)
        );
    }
}