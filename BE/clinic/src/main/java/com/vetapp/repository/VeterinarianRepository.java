package com.vetapp.repository;

import com.vetapp.entity.Veterinarian;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface VeterinarianRepository extends JpaRepository<Veterinarian, UUID> {

    List<Veterinarian> findByClinicId(UUID clinicId);
}