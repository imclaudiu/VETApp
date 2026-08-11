package com.vetapp.service;

import com.vetapp.DTO.PetPublic;
import com.vetapp.DTO.builder.PetBuilder;
import com.vetapp.client.UserClient;
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
    private final UserClient userClient;

    public PetService(PetRepository petRepository, UserClient userClient) {
        this.petRepository = petRepository;
        this.userClient = userClient;
    }

    public UUID addPet(Pet pet) {
        userClient.checkUserExists(pet.getOwnerID());

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
        userClient.checkUserExists(existingPet.getOwnerID());

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

    public void deleteAllPetsOwner(UUID ownerId) {
        List<Pet> pets = petRepository.findAllByOwnerID(ownerId);
        for(Pet pet:pets){
            pet.setOwnerID(null);
        }
        petRepository.saveAll(pets);
    }

    public void deleteOwner(UUID petID){
        Pet pet = petRepository.findById(petID).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND));
        pet.setOwnerID(null);
        petRepository.save(pet);
    }

    private Pet findPetOrThrow(UUID id) {
        return petRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Animalul cu ID-ul " + id + " nu a fost găsit."));
    }

}
