package com.vetapp.client;

import com.vetapp.DTO.builder.VeterinarianPublic;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.UUID;

@Component
public class VeterinarianClient {

    private final RestClient restClient;

    public VeterinarianClient() {
        this.restClient = RestClient.create(
//                "http://localhost:8083"
                "http://clinic:8080"
        );
    }

    public VeterinarianPublic checkVeterinarianExists(UUID veterinarianId) {
        return restClient.get()
                .uri("/vet/get/" + veterinarianId)
                .retrieve()
                .body(VeterinarianPublic.class);
    }
}