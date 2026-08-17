package com.vetapp.service;

import com.vetapp.entity.Role;
import com.vetapp.security.RsaKeyProvider;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.UUID;

@Service
public class JwtService {

    private final RsaKeyProvider rsaKeyProvider;
    private final long expirationMs = 900000; // 15min

    public JwtService(RsaKeyProvider rsaKeyProvider) {
        this.rsaKeyProvider = rsaKeyProvider;
    }

    public String generateToken(UUID userId, String username, Role role) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expirationMs);

        return Jwts.builder()
                .header().add("kid", rsaKeyProvider.getKeyId()).and()
                .subject(username)
                .claim("userId", userId.toString())
                .claim("role", role.name())
                .issuedAt(now)
                .expiration(expiry)
                .signWith(rsaKeyProvider.getPrivateKey(), SignatureAlgorithm.RS256)
                .compact();
    }
}