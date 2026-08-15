package com.vetapp.client;

import com.vetapp.DTO.builder.PetPublic;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.UUID;

@Component
public class PetClient {

    private final RestClient restClient;

    public PetClient() {
        this.restClient = RestClient.create(
                "http://localhost:8082"
        );
    }

    public PetPublic checkPetNUserExists(UUID petId) {
        return restClient.get()
                .uri("/pet/get/" + petId)
                .retrieve()
                .body(PetPublic.class);
    }
}