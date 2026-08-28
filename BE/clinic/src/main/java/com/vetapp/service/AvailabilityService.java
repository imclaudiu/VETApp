package com.vetapp.service;

import com.vetapp.entity.Availability;
import com.vetapp.DTO.AvailabilityId;
import com.vetapp.repository.AvailabilityRepository;
import com.vetapp.security.AccessGuard;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
public class AvailabilityService {

    private final AvailabilityRepository availabilityRepository;
    private final VeterinarianService veterinarianService;
    private final AccessGuard accessGuard;

    public AvailabilityService(AvailabilityRepository availabilityRepository, VeterinarianService veterinarianService, AccessGuard accessGuard) {
        this.availabilityRepository = availabilityRepository;
        this.veterinarianService = veterinarianService;
        this.accessGuard = accessGuard;
    }

    public Availability addAvailability(Availability availability, Jwt jwt) {
        if (availability.getId() == null || availability.getId().getVeterinarianId() == null || availability.getId().getDay() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Datele programului sunt incomplete.");
        }

        if (availability.getStartHour() == null || availability.getEndHour() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ora de început și ora de final sunt obligatorii.");
        }

        if (!availability.getEndHour().isAfter(availability.getStartHour())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ora de final trebuie să fie după ora de început.");
        }

        UUID veterinarianId = availability.getId().getVeterinarianId();
        UUID vetUserId = veterinarianService.getVeterinarianUserId(veterinarianId);

        accessGuard.requireOwnerOrAdmin(vetUserId, jwt);

        if (availabilityRepository.existsById(availability.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Există deja un program pentru această dată.");
        }

        return availabilityRepository.save(availability);
    }


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


    public Availability updateAvailability(UUID veterinarianId, LocalDate day, Availability updatedAvailability, Jwt jwt) {
        UUID vetUserId = veterinarianService.getVeterinarianUserId(veterinarianId);
        accessGuard.requireOwnerOrAdmin(vetUserId, jwt);

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

        if (!existingAvailability.getEndHour().isAfter(existingAvailability.getStartHour())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Ora de final trebuie să fie după ora de început."
            );
        }

        return availabilityRepository.save(existingAvailability);
    }

    public void deleteAvailability(UUID veterinarianId, LocalDate day, Jwt jwt) {
        UUID vetUserId = veterinarianService.getVeterinarianUserId(veterinarianId);
        accessGuard.requireOwnerOrAdmin(vetUserId, jwt);

        AvailabilityId id = new AvailabilityId(veterinarianId, day);

        Availability existingAvailability = availabilityRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Nu există disponibilitate pentru medicul respectiv în această zi."
                ));

        availabilityRepository.delete(existingAvailability);
    }

    public List<Availability> getByVeterinarianId(UUID veterinarianId) {
        veterinarianService.getVeterinarianById(veterinarianId);
        return availabilityRepository.findByIdVeterinarianId(veterinarianId);
    }
}