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

    // NOU: doar veterinarul insusi (isi seteaza propriul program) sau admin
    public Availability addAvailability(Availability availability, Jwt jwt) {
        UUID veterinarianId = availability.getId().getVeterinarianId();
        UUID vetUserId = veterinarianService.getVeterinarianUserId(veterinarianId);
        accessGuard.requireOwnerOrAdmin(vetUserId, jwt);

        veterinarianService.getVeterinarianById(veterinarianId); // valideaza ca veterinarul exista

        // FIX: previne upsert accidental - addAvailability nu ar trebui sa suprascrie silentios
        if (availabilityRepository.existsById(availability.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Există deja disponibilitate setată pentru acest medic în această zi. Folosește update."
            );
        }

        return availabilityRepository.save(availability);
    }

    // ramane public - browse (clientii vad programul liber, ca sa faca rezervari)
    public List<Availability> getAllAvailabilities() {
        return availabilityRepository.findAll();
    }

    // ramane public - browse
    public Availability getAvailability(UUID veterinarianId, LocalDate day) {
        AvailabilityId id = new AvailabilityId(veterinarianId, day);

        return availabilityRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Nu există disponibilitate pentru medicul respectiv în această zi."
                ));
    }

    // NOU: doar veterinarul insusi sau admin
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

    // NOU: doar veterinarul insusi sau admin
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
}