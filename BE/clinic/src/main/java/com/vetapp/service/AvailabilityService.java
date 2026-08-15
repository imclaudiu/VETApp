package com.vetapp.service;

import com.vetapp.client.UserClient;
import com.vetapp.entity.Availability;
import com.vetapp.DTO.AvailabilityId;
import com.vetapp.repository.AvailabilityRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.Date;
import java.util.UUID;

@Service
public class AvailabilityService {

    private final AvailabilityRepository availabilityRepository;
    private final VeterinarianService veterinarianService;

    public AvailabilityService(AvailabilityRepository availabilityRepository, VeterinarianService veterinarianService) {
        this.availabilityRepository = availabilityRepository;
        this.veterinarianService = veterinarianService;
    }

    public Availability addAvailability(Availability availability) {
        veterinarianService.getVeterinarianById(availability.getId().getVeterinarianId());
        return availabilityRepository.save(availability);
    } // BUG MIGHT BE FEATURE? CAND ADAUG ALTA ORA PE ACEEASI DATA SI ACELASI MEDIC NU CREEAZA CONFLICT,
    // CI MODIFICA DOAR. UN 2IN1 CREATE+UPDATE?

    public List<Availability> getAllAvailabilities() {
        return availabilityRepository.findAll();
    }

    public Availability getAvailability(UUID veterinarianId, LocalDate day) {

        AvailabilityId id = new AvailabilityId(veterinarianId, day);

        return availabilityRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Nu există disponibilitate pentru medicul respectiv în această zi."
                ));
    }

    public Availability updateAvailability(
            UUID veterinarianId,
            LocalDate day,
            Availability updatedAvailability) {

        AvailabilityId id = new AvailabilityId(veterinarianId, day);

        Availability existingAvailability = availabilityRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Nu există disponibilitate pentru medicul respectiv în această zi."
                ));

        if (updatedAvailability.getStartHour() != null) {
            existingAvailability.setStartHour(updatedAvailability.getStartHour());
        }

        if (updatedAvailability.getEndHour() != null) {
            existingAvailability.setEndHour(updatedAvailability.getEndHour());
        }

        if (!existingAvailability.getEndHour()
                .isAfter(existingAvailability.getStartHour())) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Ora de final trebuie să fie după ora de început."
            );
        }

        return availabilityRepository.save(existingAvailability);
    }

    public void deleteAvailability(UUID veterinarianId, LocalDate day) {

        AvailabilityId id = new AvailabilityId(veterinarianId, day);

        Availability existingAvailability = availabilityRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Nu există disponibilitate pentru medicul respectiv în această zi."
                ));

        availabilityRepository.delete(existingAvailability);
    }
}