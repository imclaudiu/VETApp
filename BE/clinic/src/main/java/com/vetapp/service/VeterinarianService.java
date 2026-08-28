package com.vetapp.service;

import com.vetapp.DTO.UserPublic;
import com.vetapp.DTO.VeterinarianPublic;
import com.vetapp.client.AuthClient;
import com.vetapp.client.UserClient;
import com.vetapp.entity.Veterinarian;
import com.vetapp.repository.VeterinarianRepository;
import com.vetapp.security.AccessGuard;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
public class VeterinarianService {

    private final VeterinarianRepository veterinarianRepository;
    private final ClinicService clinicService;
    private final UserClient userClient;
    private final AuthClient authClient;
    private final AccessGuard accessGuard;

    public VeterinarianService(VeterinarianRepository veterinarianRepository,
                               ClinicService clinicService,
                               UserClient userClient,
                               AuthClient authClient,
                               AccessGuard accessGuard) {
        this.veterinarianRepository = veterinarianRepository;
        this.clinicService = clinicService;
        this.userClient = userClient;
        this.authClient = authClient;
        this.accessGuard = accessGuard;
    }

    public UUID addVeterinarian(Veterinarian veterinarian, Jwt jwt) {
        accessGuard.requireAdmin(jwt);

//        userClient.checkUserExists(veterinarian.getUserId());

        if (veterinarianRepository.existsByUserId(veterinarian.getUserId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Userul este deja medic veterinar.");
        }

        clinicService.getClinicById(veterinarian.getClinicId());

        authClient.updateAuthRole(
                veterinarian.getUserId(),
                "VETERINARIAN",
                jwt.getTokenValue()
        );

        veterinarianRepository.save(veterinarian);
        return veterinarian.getId();
    }

    public List<Veterinarian> getAllVeterinarians() {
        return veterinarianRepository.findAll();
    }

    public VeterinarianPublic getVeterinarianById(UUID id) {

        Veterinarian veterinarian = veterinarianRepository.findById(id).orElseThrow(() ->
                                new ResponseStatusException(HttpStatus.NOT_FOUND, "Veterinarul nu a fost găsit."));

        UserPublic user = userClient.getUserById(veterinarian.getUserId());

        return new VeterinarianPublic(
                veterinarian.getId(),
                veterinarian.getUserId(),
                veterinarian.getClinicId(),
                user.getName(),
                veterinarian.getSurgeon()
        );
    }

    public List<VeterinarianPublic> getVeterinariansByClinicId(UUID clinicId) {

        List<Veterinarian> veterinarians = veterinarianRepository.findByClinicId(clinicId);


        return veterinarians.stream().map(veterinarian -> {
                    UserPublic user = userClient.getUserById(veterinarian.getUserId());
                    return new VeterinarianPublic(
                            veterinarian.getId(),
                            veterinarian.getUserId(),
                            veterinarian.getClinicId(),
                            user.getName(),
                            veterinarian.getSurgeon()
                    );
                })
                .toList();
    }

    public UUID getVeterinarianClinicId(UUID veterinarianId) {
        Veterinarian veterinarian = veterinarianRepository.findById(veterinarianId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Veterinarul nu a fost găsit."));

        return veterinarian.getClinicId();
    }

    public UUID getVeterinarianUserId(UUID veterinarianId){
        Veterinarian veterinarian = veterinarianRepository.findById(veterinarianId).orElseThrow(()-> new ResponseStatusException(HttpStatus.NOT_FOUND, "Vet n a fost gasit."));
        return veterinarian.getUserId();
    }

    public Veterinarian updateVeterinarian(UUID id, Veterinarian updatedVeterinarian, Jwt jwt) {
        Veterinarian veterinarian = veterinarianRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Veterinarul cu ID-ul " + id + " nu a fost găsit."));

        accessGuard.requireOwnerOrAdmin(veterinarian.getUserId(), jwt);

        if (updatedVeterinarian.getUserId() != null) {
            accessGuard.requireAdmin(jwt);
            veterinarian.setUserId(updatedVeterinarian.getUserId());
        }

        if (updatedVeterinarian.getClinicId() != null) {
            accessGuard.requireAdmin(jwt);
            clinicService.getClinicById(updatedVeterinarian.getClinicId());
            veterinarian.setClinicId(updatedVeterinarian.getClinicId());
        }

        if (updatedVeterinarian.getSurgeon() != null) {
            veterinarian.setSurgeon(updatedVeterinarian.getSurgeon());
        }

        return veterinarianRepository.save(veterinarian);
    }

    public void deleteVeterinarian(UUID id, Jwt jwt) {
        accessGuard.requireAdmin(jwt);

        Veterinarian veterinarian = veterinarianRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Veterinarul nu a fost găsit."));

        authClient.updateAuthRole(
                veterinarian.getUserId(),
                "OWNER",
                jwt.getTokenValue()
        );

        veterinarianRepository.delete(veterinarian);
    }

    public VeterinarianPublic getMyVeterinarian(Jwt jwt) {
        UUID userId = accessGuard.extractUserId(jwt);

        Veterinarian veterinarian = veterinarianRepository.findByUserId(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Nu există profil de veterinar pentru acest utilizator."));

        UserPublic user = userClient.getUserById(veterinarian.getUserId());

        return new VeterinarianPublic(veterinarian.getId(), veterinarian.getUserId(), veterinarian.getClinicId(), user.getName(), veterinarian.getSurgeon());
    }

}