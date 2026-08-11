package com.vetapp.service;

import com.vetapp.entity.Veterinarian;
import com.vetapp.repository.VeterinarianRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
public class VeterinarianService {

    private final VeterinarianRepository veterinarianRepository;

    public VeterinarianService(VeterinarianRepository veterinarianRepository) {
        this.veterinarianRepository = veterinarianRepository;
    }

    public UUID addVeterinarian(Veterinarian veterinarian) {
        veterinarianRepository.save(veterinarian);
        return veterinarian.getId();
    }

    public List<Veterinarian> getAllVeterinarians() {
        return veterinarianRepository.findAll();
    }

    public Veterinarian getVeterinarianById(UUID id) {
        return veterinarianRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Medicul veterinar cu ID-ul " + id + " nu a fost găsit."
                ));
    }

    public List<Veterinarian> getVeterinariansByClinicId(UUID clinicId) {
        return veterinarianRepository.findByClinicId(clinicId);
    }

    public Veterinarian updateVeterinarian(UUID id, Veterinarian updatedVeterinarian) {

        Veterinarian existingVeterinarian = veterinarianRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Medicul veterinar cu ID-ul " + id + " nu a fost găsit."
                ));

        existingVeterinarian.setUserId(updatedVeterinarian.getUserId());
        existingVeterinarian.setClinicId(updatedVeterinarian.getClinicId());
        existingVeterinarian.setSurgeon(updatedVeterinarian.getSurgeon());

        return veterinarianRepository.save(existingVeterinarian);
    }

    public void deleteVeterinarian(UUID id) {

        Veterinarian existingVeterinarian = veterinarianRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Medicul veterinar cu ID-ul " + id + " nu a fost găsit."
                ));

        veterinarianRepository.delete(existingVeterinarian);
    }
}