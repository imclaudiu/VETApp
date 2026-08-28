package com.vetapp.controller;


import com.vetapp.DTO.AdminUserDetails;
import com.vetapp.DTO.UserProfile;
import com.vetapp.DTO.UserPublic;
import com.vetapp.entity.RolUser;
import com.vetapp.service.UserService;
import com.vetapp.entity.Users;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@Validated
@RequestMapping("/user")
public class UserController {
    private final UserService userService;

    public UserController(UserService userService){
        this.userService = userService;
    }

    @PostMapping("/addUser")
    public ResponseEntity<UUID> addUser(@RequestBody Users user) {
        UUID id = userService.addUser(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(id);
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<Users>> getAll(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(userService.getAllUsers(jwt));
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<UserPublic> getUserById(@PathVariable UUID id, @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(userService.getUserById(id, jwt));
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<Users> updateUser(@PathVariable UUID id, @RequestBody Users updatedUser, @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(userService.updateUser(id, updatedUser, jwt));
    }

    @GetMapping("/public/{id}")
    public ResponseEntity<UserPublic> getPublicUserById(
            @PathVariable UUID id
    ) {

        return ResponseEntity.ok(
                userService.getPublicUserById(id)
        );
    }

    @GetMapping("/me")
    public ResponseEntity<UserProfile> getMyProfile(
            @AuthenticationPrincipal Jwt jwt
    ) {
        return ResponseEntity.ok(
                userService.getMyProfile(jwt)
        );
    }

    @GetMapping("/admin/{id}")
    public ResponseEntity<AdminUserDetails> getAdminUserDetails(
            @PathVariable UUID id,
            @AuthenticationPrincipal Jwt jwt) {

        return ResponseEntity.ok(
                userService.getAdminUserDetails(id, jwt)
        );
    }

}
