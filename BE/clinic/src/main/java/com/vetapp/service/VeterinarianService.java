package com.vetapp.service;

import com.vetapp.DTO.UserPublic;
import com.vetapp.DTO.VeterinarianPublic;
import com.vetapp.client.UserClient;
import com.vetapp.entity.Clinic;
import com.vetapp.entity.RolUser;
import com.vetapp.entity.Veterinarian;
import com.vetapp.repository.VeterinarianRepository;
import jakarta.security.auth.message.ClientAuth;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class VeterinarianService {

    private final VeterinarianRepository veterinarianRepository;
    private final ClinicService clinicService;
    private final UserClient userClient;

    public VeterinarianService(VeterinarianRepository veterinarianRepository, ClinicService clinicService, UserClient userClient) {
        this.veterinarianRepository = veterinarianRepository;
        this.clinicService = clinicService;
        this.userClient = userClient;
    }

    public UUID addVeterinarian(Veterinarian veterinarian) {
        userClient.checkUserExists(veterinarian.getUserId());

        if (veterinarianRepository.existsByUserId(veterinarian.getUserId())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Userul este deja medic veterinar."
            );
        }

        clinicService.getClinicById(veterinarian.getClinicId());

        userClient.updateUserRole(
                veterinarian.getUserId(),
                RolUser.VETERINARIAN
        );
        veterinarianRepository.save(veterinarian);
        return veterinarian.getId();
    }

    public List<Veterinarian> getAllVeterinarians() {
        return veterinarianRepository.findAll();
    }

    public VeterinarianPublic getVeterinarianById(UUID id) {

        Veterinarian veterinarian = veterinarianRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Veterinarul nu a fost găsit."
                ));

        UserPublic user = userClient.getUserById(veterinarian.getUserId());


        return new VeterinarianPublic(
                veterinarian.getId(),
                veterinarian.getUserId(),
                veterinarian.getClinicId(),
                user.getName(),
                veterinarian.getSurgeon()
        );
    }

    public List<Veterinarian> getVeterinariansByClinicId(UUID clinicId) {
        return veterinarianRepository.findByClinicId(clinicId);
    }

    public Veterinarian updateVeterinarian(UUID id, Veterinarian updatedVeterinarian) {

        Veterinarian veterinarian = veterinarianRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Veterinarul cu ID-ul " + id + " nu a fost găsit."
                ));

        if (updatedVeterinarian.getUserId() != null) {
            veterinarian.setUserId(updatedVeterinarian.getUserId());
        }

        if (updatedVeterinarian.getClinicId() != null) {
            veterinarian.setClinicId(updatedVeterinarian.getClinicId());
        }

        if (updatedVeterinarian.getSurgeon() != null) {
            veterinarian.setSurgeon(updatedVeterinarian.getSurgeon());
        }

        return veterinarianRepository.save(veterinarian);
    }

    public void deleteVeterinarian(UUID id) {

        Veterinarian existingVeterinarian = veterinarianRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Medicul veterinar cu ID-ul " + id + " nu a fost găsit."
                ));

        Veterinarian veterinarian = veterinarianRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Veterinarul nu a fost găsit."
                ));

        userClient.updateUserRole(
                veterinarian.getUserId(),
                RolUser.OWNER
        );

        veterinarianRepository.delete(existingVeterinarian);
    }
}