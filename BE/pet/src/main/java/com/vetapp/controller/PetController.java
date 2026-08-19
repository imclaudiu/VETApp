package com.vetapp.controller;

import com.vetapp.DTO.PetPublic;
import com.vetapp.entity.Pet;
import com.vetapp.service.PetService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/pet")
public class PetController {

    private final PetService petService;

    public PetController(PetService petService) {
        this.petService = petService;
    }

    @PostMapping("/add")
    public ResponseEntity<UUID> addPet(@RequestBody Pet pet, @AuthenticationPrincipal Jwt jwt) {
        UUID id = petService.addPet(pet, jwt);
        return ResponseEntity.status(HttpStatus.CREATED).body(id);
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<Pet>> getAll(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(petService.getAllPets(jwt));
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<PetPublic> getPetById(@PathVariable UUID id, @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(petService.getPetById(id, jwt));
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<Pet> updatePet(@PathVariable UUID id,
                                         @RequestBody Pet updatedPet,
                                         @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(petService.updatePet(id, updatedPet, jwt));
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> deletePet(@PathVariable UUID id, @AuthenticationPrincipal Jwt jwt) {
        petService.deletePet(id, jwt);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/removeOwner")
    public ResponseEntity<Void> removeOwner(@PathVariable UUID id, @AuthenticationPrincipal Jwt jwt) {
        petService.deleteOwner(id, jwt);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/deleteAll")
    public ResponseEntity<Void> deleteAll(@AuthenticationPrincipal Jwt jwt) {
        petService.deleteAll(jwt);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/mine")
    public ResponseEntity<List<Pet>> getMyPets(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(petService.getMyPets(jwt));
    }
}