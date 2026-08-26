package com.vetapp.client;

import com.vetapp.DTO.AppointmentMedical;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Component
public class AppointmentClient {

    private final RestClient restClient;
    private final String internalApiKey;

    public AppointmentClient(RestClient.Builder restClientBuilder,
                             @Value("${INTERNAL_API_KEY}") String internalApiKey) {
        this.restClient = restClientBuilder.baseUrl("http://appointment:8080").build();
        this.internalApiKey = internalApiKey;
    }

    public AppointmentMedical checkAppointmentExists(UUID appointmentId) {
        return restClient.get()
                .uri("/appointment/internal/{id}", appointmentId)
                .header("X-Internal-Key", internalApiKey)
                .retrieve()
                .onStatus(status -> status.is4xxClientError() || status.is5xxServerError(),
                        (request, response) -> {
                            throw new ResponseStatusException(
                                    response.getStatusCode(),
                                    "Appointment Service Error."
                            );
                        })
                .body(AppointmentMedical.class);
    }

    public void finishAppointment(UUID appointmentId) {
        restClient.patch()
                .uri("/appointment/internal/{id}/finish", appointmentId)
                .header("X-Internal-Key", internalApiKey)
                .retrieve()
                .onStatus(status -> status.is4xxClientError() || status.is5xxServerError(),
                        (request, response) -> {
                            throw new ResponseStatusException(
                                    response.getStatusCode(),
                                    "Could not finish appointment."
                            );
                        })
                .toBodilessEntity();
    }
}