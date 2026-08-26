package com.vetapp.controller;

import com.vetapp.entity.VetService;
import com.vetapp.service.VetServiceService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/vetService")
public class VetServiceController {

    private final VetServiceService vetServiceService;

    public VetServiceController(VetServiceService vetServiceService) {
        this.vetServiceService = vetServiceService;
    }

    @PostMapping("/add")
    public ResponseEntity<Long> addService(@RequestBody VetService vetService, @AuthenticationPrincipal Jwt jwt) {
        Long id = vetServiceService.addService(vetService, jwt);
        return ResponseEntity.status(HttpStatus.CREATED).body(id);
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<VetService> getById(@PathVariable Long id) {
        return ResponseEntity.ok(vetServiceService.getServiceById(id));
    }

    @GetMapping("/clinic/{clinicId}")
    public ResponseEntity<List<VetService>> getByClinicId(@PathVariable UUID clinicId) {
        return ResponseEntity.ok(vetServiceService.getServicesByClinicId(clinicId));
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<VetService> updateService(@PathVariable Long id,
                                                    @RequestBody VetService updatedVetService,
                                                    @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(vetServiceService.updateService(id, updatedVetService, jwt));
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> deleteService(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        vetServiceService.deleteService(id, jwt);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/check/{serviceId}/veterinarian/{veterinarianId}")
    public ResponseEntity<UUID> checkServiceForVeterinarian(@PathVariable Long serviceId, @PathVariable UUID veterinarianId) {

        return ResponseEntity.ok(vetServiceService.checkServiceForVeterinarian(veterinarianId, serviceId)
        );
    }
}