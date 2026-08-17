package com.vetapp.client;

import com.vetapp.DTO.UserPublic;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Component
public class UserClient {

    private final RestClient restClient;

    public UserClient(RestClient.Builder restClientBuilder) {
        this.restClient = restClientBuilder.baseUrl(
                "http://user:8080"
//                "http://localhost:8081"
        ).build();
    }

    public UserPublic checkUserExists(UUID userId) {

        return restClient.get()
                .uri("/user/get/{id}", userId)
                .retrieve()
                .onStatus(
                        status -> status.is4xxClientError() || status.is5xxServerError(),
                        (request, response) -> {
                            throw new ResponseStatusException(
                                    response.getStatusCode(),
                                    "Eroare primita de la User Service"
                            );
                        }
                )
                .body(UserPublic.class);
    }
}