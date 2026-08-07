package com.vetapp.DTO.builder;

import com.vetapp.DTO.PetPublic;
import com.vetapp.entity.Pet;

public final class PetBuilder {
    private PetBuilder() {
    }

    public static PetPublic toPublicPet(Pet pet) {
        return new PetPublic(
                pet.getId(),
                pet.getOwnerID(),
                pet.getName(),
                pet.getSpecies(),
                pet.getRace(),
                pet.getDob(),
                pet.getSex()
        );
    }
}
