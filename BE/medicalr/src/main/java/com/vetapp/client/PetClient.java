package com.vetapp.client;

import com.vetapp.DTO.PetPublic;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Component
public class PetClient {

    private final RestClient restClient;
    private final String internalApiKey;

    public PetClient(RestClient.Builder restClientBuilder,
                     @Value("${INTERNAL_API_KEY}") String internalApiKey) {
        this.restClient = restClientBuilder.baseUrl("http://pet:8080").build();
        this.internalApiKey = internalApiKey;
    }

    public PetPublic getPetById(UUID petId) {
        return restClient.get()
                .uri("/pet/internal/{id}", petId)
                .header("X-Internal-Key", internalApiKey)
                .retrieve()
                .onStatus(status -> status.is4xxClientError() || status.is5xxServerError(),
                        (request, response) -> {
                            throw new ResponseStatusException(
                                    response.getStatusCode(),
                                    "Pet Service Error."
                            );
                        })
                .body(PetPublic.class);
    }
}