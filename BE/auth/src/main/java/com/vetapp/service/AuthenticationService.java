package com.vetapp.service;

import com.vetapp.DTO.*;
import com.vetapp.DTO.builder.AuthenticationBuilder;
import com.vetapp.entity.Authentication;
import com.vetapp.entity.Role;
import com.vetapp.repository.AuthenticationRepository;
import com.vetapp.security.AccessGuard;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
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
    private final JwtService jwtService;
    private final AccessGuard accessGuard; // NOU

    public AuthenticationService(AuthenticationRepository authenticationRepository,
                                 KafkaMessageProducer kafkaMessageProducer,
                                 JwtService jwtService,
                                 AccessGuard accessGuard) {
        this.authenticationRepository = authenticationRepository;
        this.kafkaMessageProducer = kafkaMessageProducer;
        this.jwtService = jwtService;
        this.accessGuard = accessGuard;
        this.encoder = new BCryptPasswordEncoder(4);
    }

    public AuthenticationPublic register(RegisterRequest request) {

        if (authenticationRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already in use!");
        }

        Authentication authentication = new Authentication();
        authentication.setUsername(request.getUsername());
        authentication.setPassword(encoder.encode(request.getPassword()));
        authentication.setEmail(request.getEmail());
        authentication.setTelefon(request.getPhone());
        authentication.setRole(Role.OWNER); // FIX: era Role.ADMIN, gaura de securitate

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

    public List<AdminAuthenticationPublic> getAll(Jwt jwt) {
        accessGuard.requireAdmin(jwt);

        return authenticationRepository.findAll()
                .stream()
                .map(user -> new AdminAuthenticationPublic(
                        user.getId(),
                        user.getUsername(),
                        user.getEmail(),
                        user.getRole(),
                        user.getTelefon()
                ))
                .toList();
    }

    // NOU: doar owner sau admin
    public AuthenticationPublic getAuthById(UUID id, Jwt jwt) {
        accessGuard.requireOwnerOrAdmin(id, jwt);
        Authentication authentication = authenticationRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilizatorul cu ID-ul " + id + " nu a fost gasit"));
        return AuthenticationBuilder.toPublicAuthentication(authentication);
    }

    public AuthenticationPublic getAuthByUsername(String username, Jwt jwt) {
        Authentication authentication = this.authenticationRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilizatorul cu ID-ul " + username + " nu a fost gasit"));

        accessGuard.requireOwnerOrAdmin(authentication.getId(), jwt); // NOU

        return AuthenticationBuilder.toPublicAuthentication(authentication);
    }

    // NOU: owner sau admin + update partial (doar campurile trimise)
    public AuthenticationPublic updateAuth(UUID id, Authentication updatedAuth, Jwt jwt) {
        accessGuard.requireOwnerOrAdmin(id, jwt);

        Authentication existingAuth = authenticationRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilizatorul cu ID-ul " + id + " nu a fost găsit."));

        // Username - doar daca a fost trimis
        if (updatedAuth.getUsername() != null && !updatedAuth.getUsername().isBlank()) {
            authenticationRepository.findByUsername(updatedAuth.getUsername())
                    .filter(found -> !found.getId().equals(id))
                    .ifPresent(found -> {
                        throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already in use!");
                    });
            existingAuth.setUsername(updatedAuth.getUsername());
        }


        // Email - doar daca a fost trimis
        if (updatedAuth.getEmail() != null && !updatedAuth.getEmail().isBlank()) {
            existingAuth.setEmail(updatedAuth.getEmail());
        }

        // Telefon - doar daca a fost trimis
        if (updatedAuth.getTelefon() != null && !updatedAuth.getTelefon().isBlank()) {
            existingAuth.setTelefon(updatedAuth.getTelefon());
        }

        // ATENTIE: rolul NU se schimba de aici, indiferent daca a fost trimis sau nu -
        // schimbarea rolului ar trebui sa fie un endpoint separat, doar-admin (updateRole)

        Authentication saved = authenticationRepository.save(existingAuth);
        return AuthenticationBuilder.toPublicAuthentication(saved);
    }

    // NOU: doar admin
    public void deleteAuth(UUID id, Jwt jwt) {
        accessGuard.requireAdmin(jwt);
        Authentication existingAuth = authenticationRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilizatorul cu ID-ul " + id + " nu a fost găsit."));
        authenticationRepository.delete(existingAuth);
        kafkaMessageProducer.publishUserDeleted(id);
    }

    public AuthResponse login(String username, String rawPassword) {
        Authentication authentication = authenticationRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Username sau parolă incorectă."));

        if (!encoder.matches(rawPassword, authentication.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Username sau parolă incorectă.");
        }

        String token = jwtService.generateToken(authentication.getId(), authentication.getUsername(), authentication.getRole());
        AuthenticationPublic publicUser = AuthenticationBuilder.toPublicAuthentication(authentication);

        return new AuthResponse(token, publicUser);
    }

    // NOU: doar admin
    public void deleteAll(Jwt jwt){
        accessGuard.requireAdmin(jwt);
        authenticationRepository.deleteAll();
    }

    public void deleteOwnAccount(Jwt jwt) {
        UUID userId = accessGuard.extractUserId(jwt);

        Authentication authentication = authenticationRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contul nu a fost găsit."));

        authenticationRepository.delete(authentication);
        kafkaMessageProducer.publishUserDeleted(userId);
    }

// AuthenticationService.java

    // NOU: doar admin poate schimba rolul unui user
    public void updateRole(UUID id, Role newRole, Jwt jwt) {
        accessGuard.requireAdmin(jwt);

        Authentication authentication = authenticationRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilizatorul cu ID-ul " + id + " nu a fost găsit."));

        authentication.setRole(newRole);
        authenticationRepository.save(authentication);
    }

    public void changePassword(String currentPassword, String newPassword, Jwt jwt) {
        UUID userId = accessGuard.extractUserId(jwt);

        Authentication authentication = authenticationRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contul nu a fost găsit."));

        if (!encoder.matches(currentPassword, authentication.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Parola actuală este incorectă.");
        }

        if (newPassword == null || newPassword.length() < 8) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Noua parolă trebuie să aibă cel puțin 8 caractere.");
        }

        if (encoder.matches(newPassword, authentication.getPassword())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Noua parolă trebuie să fie diferită de parola actuală.");
        }

        authentication.setPassword(encoder.encode(newPassword));
        authenticationRepository.save(authentication);
    }

    public AdminAuthenticationPublic getAdminAccount(UUID id, Jwt jwt) {
        accessGuard.requireAdmin(jwt);

        Authentication auth = authenticationRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Contul nu a fost găsit."
                ));

        return new AdminAuthenticationPublic(
                auth.getId(),
                auth.getUsername(),
                auth.getEmail(),
                auth.getRole(),
                auth.getTelefon()
        );
    }
}