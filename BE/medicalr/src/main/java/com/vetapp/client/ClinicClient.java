package com.vetapp.client;

import com.vetapp.DTO.AppointmentMedical;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.UUID;

@Component
public class ClinicClient {

    private final RestClient restClient;

    public ClinicClient() {
        this.restClient = RestClient.create(
                "http://localhost:8083"
        );
    }

//    public UUID getClinicId(UUID veterinarianId) {
//        return restClient.get()
//                .uri("/vet/getClinicId/{id}", veterinarianId)
//                .retrieve()
//                .body(UUID.class);
//    }

    public UUID checkServiceForVeterinarian(
            UUID veterinarianId,
            Long serviceId) {

      return  restClient.get()
                .uri(
                        "/vetService/check/{serviceId}/veterinarian/{veterinarianId}",
                        serviceId,
                        veterinarianId
                )
                .retrieve()
                .body(UUID.class);
    }
}