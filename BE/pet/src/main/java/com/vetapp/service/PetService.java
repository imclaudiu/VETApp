package com.vetapp.service;

import com.vetapp.DTO.PetPublic;
import com.vetapp.DTO.builder.PetBuilder;
import com.vetapp.client.UserClient;
import com.vetapp.entity.Pet;
import com.vetapp.repository.PetRepository;
import com.vetapp.security.AccessGuard;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
public class PetService {
    private final PetRepository petRepository;
    private final UserClient userClient;
    private final AccessGuard accessGuard; // NOU

    public PetService(PetRepository petRepository, UserClient userClient, AccessGuard accessGuard) {
        this.petRepository = petRepository;
        this.userClient = userClient;
        this.accessGuard = accessGuard;
    }

    // NOU: userul poate adauga pet doar pe numele lui (sau admin, pe numele oricui)
    public UUID addPet(Pet pet, Jwt jwt) {
        accessGuard.requireOwnerOrAdmin(pet.getOwnerID(), jwt);

        userClient.checkUserExists(pet.getOwnerID());

        if (pet.getId() != null && petRepository.existsById(pet.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Animalul cu ID" + pet.getId() + "exista deja");
        }
        Pet savedPet = petRepository.save(pet);
        return savedPet.getId();
    }

    // NOU: doar admin vede toate animalele din sistem
    public List<Pet> getAllPets(Jwt jwt) {
        accessGuard.requireAdmin(jwt);
        return petRepository.findAll();
    }

    public PetPublic getPetById(UUID id, Jwt jwt) {
        Pet pet = findPetOrThrow(id);
        accessGuard.requireOwnerVeterinarianOrAdmin(pet.getOwnerID(), jwt);

        return PetBuilder.toPublicPet(pet);
    }

    public Pet updatePet(UUID id, Pet updatedPet, Jwt jwt) {
        Pet existingPet = findPetOrThrow(id);

        accessGuard.requireVeterinarianOrAdmin(jwt);

        if (updatedPet.getOwnerID() != null) {
            accessGuard.requireAdmin(jwt);
            userClient.checkUserExists(updatedPet.getOwnerID());
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

    public void deletePet(UUID id, Jwt jwt) {
        Pet existingPet = findPetOrThrow(id);

        accessGuard.requireVeterinarianOrAdmin(jwt);

        petRepository.delete(existingPet);
    }

    // Ramane INTERNA - apelata din Kafka listener cand un user e sters din auth, nu are Jwt
    public void deleteAllPetsOwner(UUID ownerId) {
        List<Pet> pets = petRepository.findAllByOwnerID(ownerId);
        for (Pet pet : pets) {
            pet.setOwnerID(null);
        }
        petRepository.saveAll(pets);
    }

    // NOU: doar owner sau admin (desprindere manuala a unui pet de owner, prin HTTP)
    public void deleteOwner(UUID petID, Jwt jwt) {
        Pet pet = petRepository.findById(petID).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        accessGuard.requireOwnerOrAdmin(pet.getOwnerID(), jwt);
        pet.setOwnerID(null);
        petRepository.save(pet);
    }

    // NOU: doar admin
    public void deleteAll(Jwt jwt) {
        accessGuard.requireAdmin(jwt);
        petRepository.deleteAll();
    }

    private Pet findPetOrThrow(UUID id) {
        return petRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Animalul cu ID-ul " + id + " nu a fost găsit."));
    }

    public List<Pet> getMyPets(Jwt jwt) {
        UUID userId = accessGuard.extractUserId(jwt);
        return petRepository.findAllByOwnerID(userId);
    }

    public PetPublic getPetInternal(UUID id) {
        Pet pet = findPetOrThrow(id);
        return PetBuilder.toPublicPet(pet);
    }
}