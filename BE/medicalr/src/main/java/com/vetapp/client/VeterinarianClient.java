package com.vetapp.client;

import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Component
public class VeterinarianClient {

    private final RestClient restClient;

    public VeterinarianClient(RestClient.Builder restClientBuilder) {
        this.restClient = restClientBuilder.baseUrl("http://clinic:8080").build();
    }

    public UUID getVeterinarianUserId(UUID veterinarianId) {
        return restClient.get()
                .uri("/vet/{id}/userId", veterinarianId)
                .retrieve()
                .onStatus(
                        status -> status.is4xxClientError() || status.is5xxServerError(),
                        (request, response) -> {
                            throw new ResponseStatusException(response.getStatusCode(), "Veterinarian Service Error.");
                        }
                )
                .body(UUID.class);
    }
}