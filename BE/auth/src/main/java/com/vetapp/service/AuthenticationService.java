package com.vetapp.service;


import com.vetapp.DTO.AuthenticationPublic;
import com.vetapp.DTO.builder.AuthenticationBuilder;
import com.vetapp.entity.Authentication;
import com.vetapp.repository.AuthenticationRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCrypt;
import org.springframework.stereotype.Service;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
public class AuthenticationService {

    AuthenticationRepository authenticationRepository;
    private final BCryptPasswordEncoder encoder;

    public AuthenticationService(AuthenticationRepository authenticationRepository) {
        this.authenticationRepository = authenticationRepository;
        this.encoder = new BCryptPasswordEncoder(16);
    }

    public AuthenticationPublic insertAuth(Authentication authentication){
        if(authenticationRepository.findByUsername(authentication.getUsername()).isPresent()){
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already in use!");
        }
        String encryptedPass = encoder.encode(authentication.getPassword());
        authentication.setPassword(encryptedPass);

        authenticationRepository.save(authentication);
        AuthenticationPublic authenticationPublic = AuthenticationBuilder.toPublicAuthentication(authentication);

        return authenticationPublic;
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
