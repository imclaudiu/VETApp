package com.vetapp.client;

import com.vetapp.DTO.PetPublic;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Component
public class PetClient {

    private final RestClient restClient;

    public PetClient(RestClient.Builder restClientBuilder) {
        this.restClient = restClientBuilder.baseUrl("http://pet:8080").build();
    }

    public PetPublic getPetById(UUID petId) {
        return restClient.get()
                .uri("/pet/get/{id}", petId)
                .retrieve()
                .onStatus(
                        status -> status.is4xxClientError() || status.is5xxServerError(),
                        (request, response) -> {
                            throw new ResponseStatusException(response.getStatusCode(), "Pet Service Error.");
                        }
                )
                .body(PetPublic.class);
    }
}