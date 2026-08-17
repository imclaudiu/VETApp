package com.vetapp.DTO;

public class AuthResponse {
    private String token;
    private AuthenticationPublic user;

    public AuthResponse(String token, AuthenticationPublic user) {
        this.token = token;
        this.user = user;
    }

    public String getToken() {
        return token;
    }

    public AuthenticationPublic getUser() {
        return user;
    }
}