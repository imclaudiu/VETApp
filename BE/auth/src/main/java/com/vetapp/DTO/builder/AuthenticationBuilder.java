package com.vetapp.DTO.builder;

import com.vetapp.DTO.AuthenticationPublic;
import com.vetapp.DTO.RegisterRequest;
import com.vetapp.entity.Authentication;

public class AuthenticationBuilder {
    public static AuthenticationPublic toPublicAuthentication(Authentication authentication){
        return new AuthenticationPublic(authentication.getUsername());
    }
}
