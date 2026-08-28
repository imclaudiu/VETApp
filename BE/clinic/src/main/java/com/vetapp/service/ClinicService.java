package com.vetapp.service;

import com.vetapp.entity.Clinic;
import com.vetapp.repository.ClinicRepository;
import com.vetapp.security.AccessGuard;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
public class ClinicService {

    private final ClinicRepository clinicRepository;
    private final AccessGuard accessGuard; // NOU

    public ClinicService(ClinicRepository clinicRepository, AccessGuard accessGuard) {
        this.clinicRepository = clinicRepository;
        this.accessGuard = accessGuard;
    }

    // NOU: doar admin poate adauga o clinica
    public UUID addClinic(Clinic clinic, Jwt jwt) {
        accessGuard.requireAdmin(jwt);
        clinicRepository.save(clinic);
        return clinic.getId();
    }

    // ramane public - browse
    public List<Clinic> getAllClinics() {
        return clinicRepository.findAll();
    }

    // ramane public - browse
    public List<Clinic> getClinicsByCity(String city) {
        List<Clinic> clinicList = clinicRepository.findByCityIgnoreCase(city)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Error:" + city));

        if (clinicList.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }

        return clinicList;
    }

    // ramane public - browse
    public Clinic getClinicById(UUID id) {
        return clinicRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Clinica cu ID-ul " + id + " nu a fost găsită."
                ));
    }

    // NOU: doar admin + update partial
    public Clinic updateClinic(UUID id, Clinic updatedClinic, Jwt jwt) {
        accessGuard.requireAdmin(jwt);

        Clinic existingClinic = clinicRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Clinica cu ID-ul " + id + " nu a fost găsită."
                ));

        if (updatedClinic.getName() != null) {
            existingClinic.setName(updatedClinic.getName());
        }
        if (updatedClinic.getAddress() != null) {
            existingClinic.setAddress(updatedClinic.getAddress());
        }
        if (updatedClinic.getCity() != null) {
            existingClinic.setCity(updatedClinic.getCity());
        }
        if (updatedClinic.getPhone() != null) {
            existingClinic.setPhone(updatedClinic.getPhone());
        }
        if (updatedClinic.getRating() != null) {
            existingClinic.setRating(updatedClinic.getRating());
        }
        if (updatedClinic.getGooglePlaceId() != null)
            existingClinic.setGooglePlaceId(updatedClinic.getGooglePlaceId());
        if (updatedClinic.getLatitude() != null)
            existingClinic.setLatitude(updatedClinic.getLatitude());
        if (updatedClinic.getLongitude() != null)
            existingClinic.setLongitude(updatedClinic.getLongitude());

        return clinicRepository.save(existingClinic);
    }

    // NOU: doar admin
    public void deleteClinic(UUID id, Jwt jwt) {
        accessGuard.requireAdmin(jwt);

        Clinic existingClinic = clinicRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Clinica cu ID-ul " + id + " nu a fost găsită."
                ));

        clinicRepository.delete(existingClinic);
    }
}