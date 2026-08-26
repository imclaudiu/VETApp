package com.vetapp.client;

import com.vetapp.DTO.AvailabilityPublic;
import com.vetapp.DTO.VetServicePublic;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.UUID;

@Component
public class ClinicClient {

    private final RestClient restClient;

    public ClinicClient(
            RestClient.Builder restClientBuilder
    ) {
        this.restClient = restClientBuilder.baseUrl("http://clinic:8080").build();
    }


    public VetServicePublic getService(Long serviceId) {

        return restClient.get()
                .uri("/vetService/get/{id}", serviceId).retrieve().onStatus(
                        status -> status.is4xxClientError() || status.is5xxServerError(),
                        (request, response) -> {
                            throw new ResponseStatusException(
                                    response.getStatusCode(),
                                    "Vet service could not be loaded."
                            );
                        }
                )
                .body(VetServicePublic.class);
    }


    public AvailabilityPublic getAvailability(
            UUID veterinarianId,
            LocalDate day
    ) {

        return restClient.get()
                .uri(uriBuilder -> uriBuilder.path("/availability/get").queryParam("veterinarianId", veterinarianId)
                                .queryParam(
                                        "day",
                                        day
                                )
                                .build()
                )
                .retrieve()
                .onStatus(
                        status ->
                                status.is4xxClientError()
                                        || status.is5xxServerError(),

                        (request, response) -> {
                            throw new ResponseStatusException(
                                    response.getStatusCode(),
                                    "Veterinarian is not available on this day."
                            );
                        }
                )
                .body(AvailabilityPublic.class);
    }
}