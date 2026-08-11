package com.vetapp.service;


import com.vetapp.DTO.AuthenticationPublic;
import com.vetapp.DTO.RegisterRequest;
import com.vetapp.DTO.UserRegistrationEvent;
import com.vetapp.DTO.builder.AuthenticationBuilder;
import com.vetapp.entity.Authentication;
import com.vetapp.repository.AuthenticationRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
public class AuthenticationService {

    private final AuthenticationRepository authenticationRepository;
    private final BCryptPasswordEncoder encoder;
    private final KafkaMessageProducer kafkaMessageProducer;

    public AuthenticationService(AuthenticationRepository authenticationRepository, KafkaMessageProducer kafkaMessageProducer) {
        this.authenticationRepository = authenticationRepository;
        this.kafkaMessageProducer = kafkaMessageProducer;
        this.encoder = new BCryptPasswordEncoder(4);
    }

    public AuthenticationPublic register(RegisterRequest request) {

        if (authenticationRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already in use!");
        }

        Authentication authentication = new Authentication();
        authentication.setUsername(request.getUsername());
        authentication.setPassword(encoder.encode(request.getPassword()));

        Authentication saved = authenticationRepository.save(authentication);

        UserRegistrationEvent event = new UserRegistrationEvent(
                saved.getId(),
                request.getName(),
                request.getEmail(),
                request.getPhone(),
                request.getAddress()
        );
        kafkaMessageProducer.publishUserRegistered(event);

        return AuthenticationBuilder.toPublicAuthentication(saved);
    }

//    public List<AuthenticationPublic> getAll() {
//        List<Authentication> aUthenticationList = authenticationRepository.findAll();
//        return aUthenticationList.stream().map(AuthenticationBuilder::toPublicAuthentication).toList();
//    }

    public List<Authentication> getAll() {
        List<Authentication> authenticationList = authenticationRepository.findAll();
        return authenticationList;
    }
    public AuthenticationPublic getAuthById(UUID id) {
        Authentication authentication = this.authenticationRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilizatorul cu ID-ul" + id + "nu a fost gasit"));
        return AuthenticationBuilder.toPublicAuthentication(authentication);
    }

    public AuthenticationPublic getAuthByUsername(String username) {
        Authentication authentication = this.authenticationRepository.findByUsername(username).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilizatorul cu ID-ul" + username + "nu a fost gasit"));
        return AuthenticationBuilder.toPublicAuthentication(authentication);
    }


    public AuthenticationPublic updateAuth(UUID id, Authentication updatedAuth) {
        Authentication existingAuth = authenticationRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilizatorul cu ID-ul " + id + " nu a fost găsit."));

        authenticationRepository.findByUsername(updatedAuth.getUsername()).filter(found -> !found.getId().equals(id))
                .ifPresent(found -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already in use!");
                });

        existingAuth.setUsername(updatedAuth.getUsername());

        if (updatedAuth.getPassword() != null && !updatedAuth.getPassword().isBlank()) {
            existingAuth.setPassword(encoder.encode(updatedAuth.getPassword()));
        }

        Authentication saved = authenticationRepository.save(existingAuth);
        return AuthenticationBuilder.toPublicAuthentication(saved);
    }

    public void deleteAuth(UUID id) {
        Authentication existingAuth = authenticationRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilizatorul cu ID-ul " + id + " nu a fost găsit."));
        authenticationRepository.delete(existingAuth);
        kafkaMessageProducer.publishUserDeleted(id);
    }

    public AuthenticationPublic login(String username, String rawPassword) {
        Authentication authentication = authenticationRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Username sau parolă incorectă."));

        if (!encoder.matches(rawPassword, authentication.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Username sau parolă incorectă.");
        }


        return AuthenticationBuilder.toPublicAuthentication(authentication);
    }

}
