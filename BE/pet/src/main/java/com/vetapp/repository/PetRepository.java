package com.vetapp.repository;

import com.vetapp.entity.Pet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PetRepository extends JpaRepository<Pet, UUID> {
    Optional<Pet> findByOwnerID(UUID ownerID);
}
