package com.vetapp.client;

import com.vetapp.DTO.VeterinarianPublic;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Component
public class VeterinarianClient {

    private final RestClient restClient;

    public VeterinarianClient(RestClient.Builder restClientBuilder) {
        this.restClient = restClientBuilder.baseUrl(
//                "http://localhost:8083"
                "http://clinic:8080"
        ).build();
    }

    public VeterinarianPublic checkVeterinarianExists(UUID veterinarianId) {
        return restClient.get()
                .uri("/vet/get/" + veterinarianId)
                .retrieve()
                .onStatus(
                        status -> status.is4xxClientError() || status.is5xxServerError(),
                        (request, response) -> {
                            throw new ResponseStatusException(response.getStatusCode(), "GET Veterinarian Service Error.");
                        }
                )
                .body(VeterinarianPublic.class);
    }

    public UUID getVeterinarianUserId(UUID veterinarianId) {
        return restClient.get()
                .uri("/vet/{id}/userId", veterinarianId) // sau endpoint-ul echivalent, daca exista deja
                .retrieve()
                .onStatus(
                        status -> status.is4xxClientError() || status.is5xxServerError(),
                        (request, response) -> {
                            throw new ResponseStatusException(response.getStatusCode(), "GET Veterinarian Service Error.");
                        }
                )
                .body(UUID.class);
    }
}