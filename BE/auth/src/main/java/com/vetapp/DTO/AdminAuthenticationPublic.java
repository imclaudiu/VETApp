package com.vetapp.DTO;

import com.vetapp.entity.Role;
import java.util.UUID;

public record AdminAuthenticationPublic(
        UUID id,
        String username,
        String email,
        Role role,
        String telefon
) {}