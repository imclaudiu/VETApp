package com.vetapp.auth.service;

import com.vetapp.entity.Role;
import com.vetapp.security.RsaKeyProvider;
import com.vetapp.service.JwtService;
import io.jsonwebtoken.*;
import org.junit.jupiter.api.*;
import org.mockito.Mockito;

import java.security.*;
import java.security.interfaces.RSAPrivateKey;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class JwtServiceTest {

    RsaKeyProvider keyProvider;
    JwtService service;
    KeyPair keys;

    @BeforeEach
    void setUp() throws Exception {
        keys = KeyPairGenerator.getInstance("RSA").generateKeyPair();
        keyProvider = Mockito.mock(RsaKeyProvider.class);

        when(keyProvider.getPrivateKey()).thenReturn((RSAPrivateKey) keys.getPrivate());
        when(keyProvider.getKeyId()).thenReturn("vetapp-auth-key-1");

        service = new JwtService(keyProvider);
    }

    @Test
    void generateToken_shouldContainCorrectClaims() {
        UUID userId = UUID.randomUUID();

        String token = service.generateToken(userId, "claudiu", Role.OWNER);

        Jws<Claims> parsed = Jwts.parser().verifyWith(keys.getPublic()).build().parseSignedClaims(token);

        assertEquals("claudiu", parsed.getPayload().getSubject());
        assertEquals(userId.toString(), parsed.getPayload().get("userId"));
        assertEquals("OWNER", parsed.getPayload().get("role"));
        assertEquals("vetapp-auth-key-1", parsed.getHeader().getKeyId());
    }

    @Test
    void generateToken_shouldExpireAfter15Minutes() {
        String token = service.generateToken(UUID.randomUUID(), "claudiu", Role.OWNER);

        Claims claims = Jwts.parser().verifyWith(keys.getPublic()).build().parseSignedClaims(token).getPayload();

        assertEquals(900000, claims.getExpiration().getTime() - claims.getIssuedAt().getTime());
    }
}