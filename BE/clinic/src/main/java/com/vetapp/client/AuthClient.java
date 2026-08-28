package com.vetapp.client;

import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Component
public class AuthClient {

    private final RestClient restClient;

    public AuthClient(RestClient.Builder restClientBuilder) {
        this.restClient = restClientBuilder
                .baseUrl("http://auth:8080")
                .build();
    }

    public void updateAuthRole(
            UUID userId,
            String role,
            String jwtToken
    ) {

        restClient.patch()
                .uri("/auth/{id}/role", userId).header("Authorization", "Bearer " + jwtToken
                )
                .body(new UpdateRoleRequest(role))
                .retrieve()
                .onStatus(
                        status ->
                                status.is4xxClientError()
                                        || status.is5xxServerError(),
                        (request, response) -> {
                            throw new ResponseStatusException(
                                    response.getStatusCode(),
                                    "UPDATE ROLE Auth Service Error."
                            );
                        }
                )
                .toBodilessEntity();
    }

    private record UpdateRoleRequest(String role) {
    }
}