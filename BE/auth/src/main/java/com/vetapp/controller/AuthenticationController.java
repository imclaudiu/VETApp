package com.vetapp.controller;

import com.vetapp.DTO.AuthResponse;
import com.vetapp.DTO.AuthenticationPublic;
import com.vetapp.DTO.RegisterRequest;
import com.vetapp.entity.Authentication;
import com.vetapp.entity.Role;
import com.vetapp.service.AuthenticationService;
import com.vetapp.service.KafkaMessageProducer;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
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
    public ResponseEntity<AuthenticationPublic> register(@RequestBody RegisterRequest request) {
        AuthenticationPublic result = authenticationService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest loginRequest) {
        AuthResponse result = authenticationService.login(loginRequest.username(), loginRequest.password());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<Authentication>> getAll(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(authenticationService.getAll(jwt));
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<AuthenticationPublic> getAuthById(@PathVariable UUID id, @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(authenticationService.getAuthById(id, jwt));
    }

    // AuthenticationController.java
    @GetMapping("/username/{username}")
    public ResponseEntity<AuthenticationPublic> getAuthByUsername(@PathVariable String username, @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(authenticationService.getAuthByUsername(username, jwt));
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<AuthenticationPublic> updateAuth(@PathVariable UUID id,
                                                           @RequestBody Authentication updatedAuth,
                                                           @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(authenticationService.updateAuth(id, updatedAuth, jwt));
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> deleteAuth(@PathVariable UUID id, @AuthenticationPrincipal Jwt jwt) {
        authenticationService.deleteAuth(id, jwt);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/deleteAll")
    public ResponseEntity<Void> deleteAll(@AuthenticationPrincipal Jwt jwt){
        authenticationService.deleteAll(jwt);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/me")
    public ResponseEntity<Void> deleteOwnAccount(@AuthenticationPrincipal Jwt jwt) {
        authenticationService.deleteOwnAccount(jwt);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/role")
    public ResponseEntity<Void> updateRole(@PathVariable UUID id,
                                           @RequestBody UpdateRoleRequest request,
                                           @AuthenticationPrincipal Jwt jwt) {
        authenticationService.updateRole(id, request.role(), jwt);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/change-password")
    public ResponseEntity<Void> changePassword(@RequestBody ChangePasswordRequest request, @AuthenticationPrincipal Jwt jwt) {
        authenticationService.changePassword(request.currentPassword(), request.newPassword(), jwt);
        return ResponseEntity.noContent().build();
    }

    public record ChangePasswordRequest(String currentPassword, String newPassword) {}

    public record UpdateRoleRequest(Role role) {}

    public record LoginRequest(String username, String password) {}


}