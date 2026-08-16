package com.vetapp.client;

import com.vetapp.DTO.UserPublic;
import com.vetapp.entity.RolUser;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Component
public class UserClient {

    private final RestClient restClient;

    public UserClient() {
        this.restClient = RestClient.create(
//                "http://localhost:8081"
                "http://user:8080"
        );

    }

    public void updateUserRole(UUID userId, RolUser role) {

        restClient.patch()
                .uri("/user/updateRole/{id}", userId)
                .body(role)
                .retrieve()
                .onStatus(
                        status -> status.is4xxClientError() || status.is5xxServerError(),
                        (request, response) -> {
                            throw new ResponseStatusException(
                                    response.getStatusCode(),
                                    "UPDATE User Service Error."
                            );
                        }
                )
                .toBodilessEntity();
    }

    public void checkUserExists(UUID userId) {

        restClient.get()
                .uri("/user/get/{id}", userId)
                .retrieve()
                .onStatus(
                        status -> status.is4xxClientError() || status.is5xxServerError(),
                        (request, response) -> {
                            throw new ResponseStatusException(
                                    response.getStatusCode(),
                                    "CHECK User Service Error."
                            );
                        }
                )
                .toBodilessEntity();
    }

    public UserPublic getUserById(UUID userId) {

        return restClient.get()
                .uri("/user/get/{id}", userId)
                .retrieve()
                .onStatus(
                        status -> status.is4xxClientError() || status.is5xxServerError(),
                        (request, response) -> {
                            throw new ResponseStatusException(
                                    response.getStatusCode(),
                                    "GET User Service Error."
                            );
                        }
                )
                .body(UserPublic.class);
    }
}