package com.vetapp.repository;

import com.vetapp.entity.Users;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<Users, UUID> {

    Optional<Users> findByName(String name);

    Optional<Users> findByEmail(String email);

    Optional<Users> findByTelefon(String telefon);

}
