package com.vetapp.repository;

import com.vetapp.entity.Clinic;
import com.vetapp.entity.Users;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ClinicRepository extends JpaRepository<Clinic, UUID> {

    Optional<List<Clinic>> findByCityIgnoreCase(String city);

}
