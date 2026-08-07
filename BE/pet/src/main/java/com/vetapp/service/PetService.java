package com.vetapp.service;

import com.vetapp.DTO.PetPublic;
import com.vetapp.DTO.builder.PetBuilder;
import com.vetapp.entity.Pet;
import com.vetapp.repository.PetRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
public class PetService {
    private final PetRepository petRepository;

    public PetService(PetRepository petRepository) {
        this.petRepository = petRepository;
    }

    public UUID addPet(Pet pet) {
        if(pet.getId() != null && petRepository.existsById(pet.getId())){
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Animalul cu ID" + pet.getId() + "exista deja");
        }
        Pet savedPet = petRepository.save(pet);
        return savedPet.getId();
    }

    public List<Pet> getAllPets() {
        return petRepository.findAll();
    }

    public PetPublic getPetById(UUID id) {
        Pet pet = findPetOrThrow(id);
        return PetBuilder.toPublicPet(pet);
    }

    public Pet updatePet(UUID id, Pet updatedPet) {
        Pet existingPet = findPetOrThrow(id);

        if (updatedPet.getOwnerID() != null) {
            existingPet.setOwnerID(updatedPet.getOwnerID());
        }
        if (updatedPet.getName() != null) {
            existingPet.setName(updatedPet.getName());
        }
        if (updatedPet.getSpecies() != null) {
            existingPet.setSpecies(updatedPet.getSpecies());
        }
        if (updatedPet.getRace() != null) {
            existingPet.setRace(updatedPet.getRace());
        }
        if (updatedPet.getDob() != null) {
            existingPet.setDob(updatedPet.getDob());
        }
        if (updatedPet.getSex() != null) {
            existingPet.setSex(updatedPet.getSex());
        }

        return petRepository.save(existingPet);
    }

    public void deletePet(UUID id) {
        Pet existingPet = findPetOrThrow(id);
        petRepository.delete(existingPet);
    }

    private Pet findPetOrThrow(UUID id) {
        return petRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Animalul cu ID-ul " + id + " nu a fost găsit."));
    }

}
