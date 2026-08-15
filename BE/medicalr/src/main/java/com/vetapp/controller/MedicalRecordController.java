package com.vetapp.controller;

import com.vetapp.entity.MedicalRecord;
import com.vetapp.service.MedicalRecordService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/medicalRecord")
public class MedicalRecordController {

    private final MedicalRecordService medicalRecordService;

    public MedicalRecordController(MedicalRecordService medicalRecordService) {
        this.medicalRecordService = medicalRecordService;
    }

    @PostMapping("/add")
    public ResponseEntity<UUID> addMedicalRecord(
            @RequestBody MedicalRecord medicalRecord) {

        UUID id = medicalRecordService.addMedicalRecord(medicalRecord);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(id);
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<MedicalRecord>> getAllMedicalRecords() {

        return ResponseEntity.ok(
                medicalRecordService.getAllMedicalRecords()
        );
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<MedicalRecord> getMedicalRecordById(
            @PathVariable UUID id) {

        return ResponseEntity.ok(
                medicalRecordService.getMedicalRecordById(id)
        );
    }

    @GetMapping("/pet/{petId}")
    public ResponseEntity<List<MedicalRecord>> getMedicalRecordsByPetId(
            @PathVariable UUID petId) {

        return ResponseEntity.ok(
                medicalRecordService.getMedicalRecordsByPetId(petId)
        );
    }

    @GetMapping("/appointment/{appointmentId}")
    public ResponseEntity<MedicalRecord> getMedicalRecordByAppointmentId(
            @PathVariable UUID appointmentId) {

        return ResponseEntity.ok(
                medicalRecordService
                        .getMedicalRecordByAppointmentId(appointmentId)
        );
    }

    @PatchMapping("/update/{id}")
    public ResponseEntity<Void> updateMedicalRecord(
            @PathVariable UUID id,
            @RequestBody MedicalRecord medicalRecord) {

        medicalRecordService.updateMedicalRecord(
                id,
                medicalRecord
        );

        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> deleteMedicalRecord(
            @PathVariable UUID id) {

        medicalRecordService.deleteMedicalRecord(id);

        return ResponseEntity.noContent().build();
    }
}