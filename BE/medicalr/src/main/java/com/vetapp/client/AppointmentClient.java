package com.vetapp.client;

import com.vetapp.DTO.AppointmentMedical;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.UUID;

@Component
public class AppointmentClient {

    private final RestClient restClient;

    public AppointmentClient() {
        this.restClient = RestClient.create(
                "http://localhost:8083"
        );
    }

    public AppointmentMedical checkAppointmentExists(UUID appointmentId) {
        return restClient.get()
                .uri("/appointment/get/" + appointmentId)
                .retrieve()
                .body(AppointmentMedical.class);
    }
}