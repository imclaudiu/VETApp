package com.vetapp.client;

import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Component
public class ClinicClient {

    private final RestClient restClient;

    public ClinicClient(RestClient.Builder restClientBuilder) {
        this.restClient = restClientBuilder.baseUrl("http://clinic:8080").build();
    }

    public UUID checkServiceForVeterinarian(UUID veterinarianId, Long serviceId) {
        return restClient.get()
                .uri("/vetService/check/{serviceId}/veterinarian/{veterinarianId}", serviceId, veterinarianId)
                .retrieve()
                .onStatus(
                        status -> status.is4xxClientError() || status.is5xxServerError(),
                        (request, response) -> {
                            throw new ResponseStatusException(response.getStatusCode(), "Clinic Service Error.");
                        }
                )
                .body(UUID.class);
    }
}