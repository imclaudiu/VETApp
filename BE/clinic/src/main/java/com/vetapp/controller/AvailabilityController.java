package com.vetapp.controller;

import com.vetapp.entity.Availability;
import com.vetapp.service.AvailabilityService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/availability")
public class AvailabilityController {

    private final AvailabilityService availabilityService;

    public AvailabilityController(AvailabilityService availabilityService) {
        this.availabilityService = availabilityService;
    }

    @PostMapping("/add")
    public ResponseEntity<Availability> addAvailability(
            @RequestBody Availability availability) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(availabilityService.addAvailability(availability));
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<Availability>> getAllAvailabilities() {
        return ResponseEntity.ok(
                availabilityService.getAllAvailabilities()
        );
    }

    @GetMapping("/get/{veterinarianId}/{day}")
    public ResponseEntity<Availability> getAvailability(
            @PathVariable UUID veterinarianId,
            @PathVariable
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate day) {

        return ResponseEntity.ok(
                availabilityService.getAvailability(veterinarianId, day)
        );
    }

    @PutMapping("/update/{veterinarianId}/{day}")
    public ResponseEntity<Availability> updateAvailability(
            @PathVariable UUID veterinarianId,
            @PathVariable
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate day,
            @RequestBody Availability updatedAvailability) {

        return ResponseEntity.ok(
                availabilityService.updateAvailability(
                        veterinarianId,
                        day,
                        updatedAvailability
                )
        );
    }

    @DeleteMapping("/delete/{veterinarianId}/{day}")
    public ResponseEntity<Void> deleteAvailability(
            @PathVariable UUID veterinarianId,
            @PathVariable
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate day) {

        availabilityService.deleteAvailability(veterinarianId, day);

        return ResponseEntity.ok().build();
    }
}