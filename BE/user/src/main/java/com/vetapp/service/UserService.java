package com.vetapp.service;

import com.vetapp.DTO.UserPublic;
import com.vetapp.DTO.builder.UserBuilder;
import com.vetapp.entity.RolUser;
import com.vetapp.repository.UserRepository;
import com.vetapp.entity.Users;
import com.vetapp.security.AccessGuard;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
public class UserService {
    private final UserRepository userRepository;
    private final KafkaMessageProducer kafkaMessageProducer;
    private final AccessGuard accessGuard; // NOU

    public UserService(UserRepository userRepository, KafkaMessageProducer kafkaMessageProducer, AccessGuard accessGuard){
        this.userRepository = userRepository;
        this.kafkaMessageProducer = kafkaMessageProducer;
        this.accessGuard = accessGuard;
    }

    public UUID addUser(Users user){
        userRepository.save(user);
        return user.getId();
    }

    // NOU: doar admin poate vedea toti userii
    public List<Users> getAllUsers(Jwt jwt) {
        accessGuard.requireAdmin(jwt);
        return userRepository.findAll();
    }

    // NOU: doar userul insusi sau admin
    public UserPublic getUserById(UUID id, Jwt jwt) {
        accessGuard.requireOwnerOrAdmin(id, jwt);

        Users user = userRepository.findById(id).
                orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilizatorul cu ID-ul " + id + " nu a fost găsit."));
        return UserBuilder.toPublicUser(user);
    }

    // NOU: doar userul insusi sau admin
    public Users updateUser(UUID id, Users updatedUser, Jwt jwt) {
        accessGuard.requireOwnerOrAdmin(id, jwt);

        Users existingUser = userRepository.findById(id).
                orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilizatorul cu ID-ul " + id + " nu a fost găsit."));

        validateUniqueFields(updatedUser, id);

        existingUser.setName(updatedUser.getName());
        existingUser.setEmail(updatedUser.getEmail());
        existingUser.setPhone(updatedUser.getPhone());
        existingUser.setAddress(updatedUser.getAddress());

        // ATENTIE: am scos `existingUser.setRol(updatedUser.getRol())` de aici -
        // vezi explicatia de mai jos, sub cod

        return userRepository.save(existingUser);
    }

    public void deleteUserInternal(UUID id) {
        Users existingUser = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilizatorul cu ID-ul " + id + " nu a fost găsit."));

        userRepository.delete(existingUser);
    }

    private void validateUniqueFields(Users user, UUID currentUserId) {
        userRepository.findByName(user.getName())
                .filter(foundUser -> !foundUser.getId().equals(currentUserId))
                .ifPresent(foundUser -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Name-ul este deja utilizat.");
                });

        userRepository.findByEmail(user.getEmail())
                .filter(foundUser -> !foundUser.getId().equals(currentUserId))
                .ifPresent(foundUser -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Adresa de email este deja utilizată.");
                });

        userRepository.findByPhone(user.getPhone())
                .filter(foundUser -> !foundUser.getId().equals(currentUserId))
                .ifPresent(foundUser -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Numărul de telefon este deja utilizat.");
                });
    }

    // NOU: doar admin
    public void deleteAll(Jwt jwt){
        accessGuard.requireAdmin(jwt);
        userRepository.deleteAll();
    }
}