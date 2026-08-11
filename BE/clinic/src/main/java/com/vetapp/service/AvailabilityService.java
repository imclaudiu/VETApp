package com.vetapp.service;

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

    public AvailabilityService(AvailabilityRepository availabilityRepository) {
        this.availabilityRepository = availabilityRepository;
    }

    public Availability addAvailability(Availability availability) {
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

        existingAvailability.setStartHour(updatedAvailability.getStartHour());
        existingAvailability.setEndHour(updatedAvailability.getEndHour());

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