package com.vetapp.controller;

import com.vetapp.DTO.PetPublic;
import com.vetapp.service.PetService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@RestController
@RequestMapping("/pet/internal")
public class InternalPetController {

    private final PetService petService;
    private final String internalApiKey;

    public InternalPetController(PetService petService, @Value("${INTERNAL_API_KEY}") String internalApiKey) {
        this.petService = petService;
        this.internalApiKey = internalApiKey;
    }

    @GetMapping("/{id}")
    public ResponseEntity<PetPublic> getPet(@PathVariable UUID id, @RequestHeader("X-Internal-Key") String key) {
        if (!internalApiKey.equals(key)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Invalid internal service key.");
        }

        return ResponseEntity.ok(petService.getPetInternal(id));
    }
}