package com.vetapp.repository;

import com.vetapp.entity.VetService;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface VetServiceRepository extends JpaRepository<VetService, Long> {

    List<VetService> findByClinicId(UUID clinicId);
    boolean existsByClinicIdAndServiceNameIgnoreCase(UUID clinicId, String serviceName);
}