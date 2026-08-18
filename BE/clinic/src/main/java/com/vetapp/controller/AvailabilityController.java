package com.vetapp.controller;

import com.vetapp.entity.Availability;
import com.vetapp.service.AvailabilityService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
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
    public ResponseEntity<Availability> addAvailability(@RequestBody Availability availability, @AuthenticationPrincipal Jwt jwt) {
        Availability saved = availabilityService.addAvailability(availability, jwt);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<Availability>> getAll() {
        return ResponseEntity.ok(availabilityService.getAllAvailabilities());
    }

    @GetMapping("/get")
    public ResponseEntity<Availability> getAvailability(@RequestParam UUID veterinarianId,
                                                        @RequestParam LocalDate day) {
        return ResponseEntity.ok(availabilityService.getAvailability(veterinarianId, day));
    }

    @PutMapping("/update")
    public ResponseEntity<Availability> updateAvailability(@RequestParam UUID veterinarianId,
                                                           @RequestParam LocalDate day,
                                                           @RequestBody Availability updatedAvailability,
                                                           @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(availabilityService.updateAvailability(veterinarianId, day, updatedAvailability, jwt));
    }

    @DeleteMapping("/delete")
    public ResponseEntity<Void> deleteAvailability(@RequestParam UUID veterinarianId,
                                                   @RequestParam LocalDate day,
                                                   @AuthenticationPrincipal Jwt jwt) {
        availabilityService.deleteAvailability(veterinarianId, day, jwt);
        return ResponseEntity.noContent().build();
    }
}