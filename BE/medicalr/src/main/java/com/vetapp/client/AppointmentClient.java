package com.vetapp.client;

import com.vetapp.DTO.AppointmentMedical;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Component
public class AppointmentClient {

    private final RestClient restClient;

    public AppointmentClient(RestClient.Builder restClientBuilder) {
        this.restClient = restClientBuilder.baseUrl("http://appointment:8080").build();
    }

    public AppointmentMedical checkAppointmentExists(UUID appointmentId) {
        return restClient.get()
                .uri("/appointment/get/{id}", appointmentId)
                .retrieve()
                .onStatus(
                        status -> status.is4xxClientError() || status.is5xxServerError(),
                        (request, response) -> {
                            throw new ResponseStatusException(response.getStatusCode(), "Appointment Service Error.");
                        }
                )
                .body(AppointmentMedical.class);
    }
}