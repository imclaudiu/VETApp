package com.vetapp.DTO;

import java.util.UUID;

public record AdminUserDetails(
        UUID id,
        String name,
        String email,
        String phone,
        String address
) {}