package com.vetapp.auth.service;

import com.vetapp.entity.Role;
import com.vetapp.security.RsaKeyProvider;
import com.vetapp.service.JwtService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.Jwts;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.interfaces.RSAPrivateKey;
import java.util.Date;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class JwtServiceTest {

    private RsaKeyProvider rsaKeyProvider;
    private JwtService jwtService;

    private KeyPair keyPair;

    @BeforeEach
    void setUp() throws Exception {

        rsaKeyProvider = mock(RsaKeyProvider.class);

        KeyPairGenerator generator =
                KeyPairGenerator.getInstance("RSA");

        generator.initialize(2048);

        keyPair = generator.generateKeyPair();

        when(rsaKeyProvider.getPrivateKey())
                .thenReturn((RSAPrivateKey) keyPair.getPrivate());

        when(rsaKeyProvider.getKeyId())
                .thenReturn("vetapp-auth-key-1");

        jwtService = new JwtService(rsaKeyProvider);
    }

    @Test
    void generateToken_shouldReturnValidToken() {

        UUID userId = UUID.randomUUID();

        String token = jwtService.generateToken(
                userId,
                "olivia",
                Role.OWNER
        );

        assertNotNull(token);
        assertFalse(token.isBlank());
    }

    @Test
    void generateToken_shouldContainCorrectClaims() {

        UUID userId = UUID.randomUUID();

        String token = jwtService.generateToken(
                userId,
                "olivia",
                Role.OWNER
        );

        Jws<Claims> parsedToken = Jwts.parser()
                .verifyWith(keyPair.getPublic())
                .build()
                .parseSignedClaims(token);

        Claims claims = parsedToken.getPayload();

        assertEquals(
                "olivia",
                claims.getSubject()
        );

        assertEquals(
                userId.toString(),
                claims.get("userId")
        );

        assertEquals(
                "OWNER",
                claims.get("role")
        );
    }

    @Test
    void generateToken_shouldContainCorrectKeyId() {

        UUID userId = UUID.randomUUID();

        String token = jwtService.generateToken(
                userId,
                "olivia",
                Role.ADMIN
        );

        Jws<Claims> parsedToken = Jwts.parser()
                .verifyWith(keyPair.getPublic())
                .build()
                .parseSignedClaims(token);

        assertEquals(
                "vetapp-auth-key-1",
                parsedToken.getHeader().getKeyId()
        );
    }

    @Test
    void generateToken_shouldExpireInApproximately15Minutes() {

        UUID userId = UUID.randomUUID();

        long beforeGeneration = System.currentTimeMillis();

        String token = jwtService.generateToken(
                userId,
                "olivia",
                Role.OWNER
        );

        long afterGeneration = System.currentTimeMillis();

        Jws<Claims> parsedToken = Jwts.parser()
                .verifyWith(keyPair.getPublic())
                .build()
                .parseSignedClaims(token);

        Date issuedAt =
                parsedToken.getPayload().getIssuedAt();

        Date expiration =
                parsedToken.getPayload().getExpiration();

        long tokenDuration =
                expiration.getTime() - issuedAt.getTime();

        // exact 15 minute
        assertEquals(
                900000,
                tokenDuration
        );

        // toleranta pentru faptul ca JWT lucreaza la secunda
        assertTrue(
                issuedAt.getTime() >= beforeGeneration - 1000
        );

        assertTrue(
                issuedAt.getTime() <= afterGeneration + 1000
        );
    }
}