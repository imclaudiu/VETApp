package com.vetapp.repository;

import com.vetapp.entity.Availability;
import com.vetapp.DTO.AvailabilityId;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AvailabilityRepository
        extends JpaRepository<Availability, AvailabilityId> {
}