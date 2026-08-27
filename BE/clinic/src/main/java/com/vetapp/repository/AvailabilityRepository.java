package com.vetapp.repository;

import com.vetapp.entity.Availability;
import com.vetapp.DTO.AvailabilityId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AvailabilityRepository extends JpaRepository<Availability, AvailabilityId> {
    List<Availability> findByIdVeterinarianId(UUID veterinarianId);
}