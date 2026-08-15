package com.vetapp.controller;

import com.vetapp.DTO.PetPublic;
import com.vetapp.entity.Pet;
import com.vetapp.service.PetService;
import org.springframework.expression.spel.ast.NullLiteral;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.UUID;

@RestController
@Validated
@RequestMapping("/pet")
public class PetController {
    private final PetService petService;

    public PetController(PetService petService) {
        this.petService = petService;
    }

    @PostMapping("/addPet")
    public ResponseEntity<UUID> addPet(@RequestBody Pet pet) {
        UUID id = petService.addPet(pet);
        return ResponseEntity.status(HttpStatus.CREATED).body(id);
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<Pet>> getAllPets() {
        if(petService.getAllPets().isEmpty()){
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Collections.emptyList());
        }
        return ResponseEntity.ok(petService.getAllPets());
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<PetPublic> getPetById(@PathVariable UUID id) {
        return ResponseEntity.ok(petService.getPetById(id));
    }

    @PatchMapping("/update/{id}")
    public ResponseEntity<Pet> updatePet(
            @PathVariable UUID id,
            @RequestBody Pet updatedPet
    ) {
        return ResponseEntity.ok(petService.updatePet(id, updatedPet));
    }

    @PatchMapping("/deleteOwner/{petID}")
    public ResponseEntity<Void> deleteOwner(@PathVariable UUID petID){
        petService.deleteAllPetsOwner(petID);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/deleteAll")
    public ResponseEntity<Void> deleteAll(){
        petService.deleteAll();
        return ResponseEntity.ok().build();
    }




    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> deletePet(@PathVariable UUID id) {
        petService.deletePet(id);
        return ResponseEntity.ok().build();
    }


}
