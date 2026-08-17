package com.vetapp.security;

import org.springframework.stereotype.Component;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.NoSuchAlgorithmException;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;

@Component
public class RsaKeyProvider {
//la fiecare restart cheile generate se pierd (tokjenurile anterioare nu mai sunt valide). Cheile trebuie sa fie permanente, nu generate la
    //runtime. Poti sa ascunzi in PEM montate c a secrete Kubernetes Secret, etc. In dezvoltare e ok
    private final RSAPrivateKey privateKey;
    private final RSAPublicKey publicKey;
    private final String keyId = "vetapp-auth-key-1"; // identificator fix pentru cheia curenta

    public RsaKeyProvider() {
        try {
            KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
            generator.initialize(2048);
            KeyPair keyPair = generator.generateKeyPair();
            this.privateKey = (RSAPrivateKey) keyPair.getPrivate();
            this.publicKey = (RSAPublicKey) keyPair.getPublic();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Nu am putut genera cheile RSA", e);
        }
    }

    public RSAPrivateKey getPrivateKey() {
        return privateKey;
    }

    public RSAPublicKey getPublicKey() {
        return publicKey;
    }

    public String getKeyId() {
        return keyId;
    }
}