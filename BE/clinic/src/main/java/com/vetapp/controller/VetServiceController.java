package com.vetapp.controller;

import com.vetapp.entity.VetService;
import com.vetapp.service.ClinicService;
import com.vetapp.service.VetServiceService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
    public ResponseEntity<Long> addService(@RequestBody VetService vetService) {
        Long id = vetServiceService.addService(vetService);
        return ResponseEntity.status(HttpStatus.CREATED).body(id);
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<VetService>> getAllServices() {
        return ResponseEntity.ok(vetServiceService.getAllServices());
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<VetService> getServiceById(@PathVariable Long id) {
        return ResponseEntity.ok(vetServiceService.getServiceById(id));
    }

    @GetMapping("/findByClinic/{clinicId}")
    public ResponseEntity<List<VetService>> getServicesByClinicId(
            @PathVariable UUID clinicId) {

        return ResponseEntity.ok(
                vetServiceService.getServicesByClinicId(clinicId)
        );
    }

    @PatchMapping("/update/{id}")
    public ResponseEntity<VetService> updateService(
            @PathVariable Long id,
            @RequestBody VetService updatedVetService) {

        return ResponseEntity.ok(
                vetServiceService.updateService(id, updatedVetService)
        );
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> deleteService(@PathVariable Long id) {
        vetServiceService.deleteService(id);
        return ResponseEntity.ok().build();
    }
}