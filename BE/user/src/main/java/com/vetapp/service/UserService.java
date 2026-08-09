package com.vetapp.service;


import com.vetapp.DTO.UserPublic;
import com.vetapp.DTO.builder.UserBuilder;
import com.vetapp.repository.UserRepository;
import com.vetapp.entity.Users;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
public class UserService {
    private final UserRepository userRepository;

    public UserService(UserRepository userRepository){
        this.userRepository = userRepository;
    }


    public UUID addUser(Users user){

   //     validateUniqueFields(user, null);

        userRepository.save(user);
        return user.getId();
    }

    public List<Users> getAllUsers() {
        return userRepository.findAll();
    }

    public UserPublic getUserById(UUID id) {
        Users user = userRepository.findById(id).
                orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilizatorul cu ID-ul " + id + " nu a fost găsit."));
        return UserBuilder.toPublicUser(user);
    }

    public Users updateUser(UUID id, Users updatedUser) {
        Users existingUser = userRepository.findById(id).
                orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilizatorul cu ID-ul " + id + " nu a fost găsit."));


        validateUniqueFields(updatedUser, id);

        existingUser.setName(updatedUser.getName());
        existingUser.setEmail(updatedUser.getEmail());
        existingUser.setTelefon(updatedUser.getTelefon());
        existingUser.setAdresa(updatedUser.getAdresa());
        existingUser.setRol(updatedUser.getRol());

        return userRepository.save(existingUser);
    }

    public void deleteUser(UUID id) {
        Users existingUser = userRepository.findById(id).
                orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilizatorul cu ID-ul " + id + " nu a fost găsit."));
        userRepository.delete(existingUser);
    }

    private void validateUniqueFields(Users user, UUID currentUserId) {
        userRepository.findByName(user.getName())
                .filter(foundUser -> !foundUser.getId().equals(currentUserId))
                .ifPresent(foundUser -> {
                    throw new ResponseStatusException(
                            HttpStatus.CONFLICT,
                            "Name-ul este deja utilizat."
                    );
                });

        userRepository.findByEmail(user.getEmail())
                .filter(foundUser -> !foundUser.getId().equals(currentUserId))
                .ifPresent(foundUser -> {
                    throw new ResponseStatusException(
                            HttpStatus.CONFLICT,
                            "Adresa de email este deja utilizată."
                    );
                });

        userRepository.findByTelefon(user.getTelefon())
                .filter(foundUser -> !foundUser.getId().equals(currentUserId))
                .ifPresent(foundUser -> {
                    throw new ResponseStatusException(
                            HttpStatus.CONFLICT,
                            "Numărul de telefon este deja utilizat."
                    );
                });
    }


}
