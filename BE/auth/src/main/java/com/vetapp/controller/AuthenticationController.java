package com.vetapp.controller;

import com.vetapp.DTO.AuthenticationPublic;
import com.vetapp.entity.Authentication;
import com.vetapp.service.AuthenticationService;
import com.vetapp.service.KafkaMessageProducer;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/auth")
public class AuthenticationController {

    private final AuthenticationService authenticationService;
    private final KafkaMessageProducer kafkaMessageProducer;

    public AuthenticationController(AuthenticationService authenticationService, KafkaMessageProducer kafkaMessageProducer) {
        this.authenticationService = authenticationService;
        this.kafkaMessageProducer = kafkaMessageProducer;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthenticationPublic> register(@RequestBody Authentication authentication) {
        AuthenticationPublic saved = authenticationService.insertAuth(authentication);
        kafkaMessageProducer.sendMessage(authentication);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthenticationPublic> login(@RequestBody LoginRequest loginRequest) {
        AuthenticationPublic result = authenticationService.login(loginRequest.username(), loginRequest.password());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<Authentication>> getAll() {
        return ResponseEntity.ok(authenticationService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AuthenticationPublic> getAuthById(@PathVariable UUID id) {
        return ResponseEntity.ok(authenticationService.getAuthById(id));
    }

    @GetMapping("/username/{username}")
    public ResponseEntity<AuthenticationPublic> getAuthByUsername(@PathVariable String username) {
        return ResponseEntity.ok(authenticationService.getAuthByUsername(username));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AuthenticationPublic> updateAuth(@PathVariable UUID id, @RequestBody Authentication updatedAuth) {
        return ResponseEntity.ok(authenticationService.updateAuth(id, updatedAuth));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAuth(@PathVariable UUID id) {
        authenticationService.deleteAuth(id);
        return ResponseEntity.noContent().build();
    }

    public record LoginRequest(String username, String password) {}
}