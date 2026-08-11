package com.vetapp.client;

import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.UUID;

@Component
public class UserClient {

    private final RestClient restClient;

    public UserClient() {
        this.restClient = RestClient.create(
                "http://localhost:8081"
        );
    }

    public void checkUserExists(UUID userId) {

        restClient.get()
                .uri("/user/get/" + userId)
                .retrieve()
                .toBodilessEntity();
    }
}