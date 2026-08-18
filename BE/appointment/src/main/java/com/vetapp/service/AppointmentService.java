package com.vetapp.service;

import com.vetapp.DTO.builder.AppointmentPublic;
import com.vetapp.DTO.builder.PetPublic;
import com.vetapp.client.VeterinarianClient;
import com.vetapp.client.PetClient;
import com.vetapp.entity.Appointment;
import com.vetapp.entity.Status;
import com.vetapp.repository.AppointmentRepository;
import com.vetapp.security.AccessGuard;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final PetClient petClient;
    private final VeterinarianClient veterinarianClient;
    private final AccessGuard accessGuard; // NOU

    public AppointmentService(AppointmentRepository appointmentRepository, PetClient petClient, VeterinarianClient veterinarianClient, AccessGuard accessGuard) {
        this.appointmentRepository = appointmentRepository;
        this.petClient = petClient;
        this.veterinarianClient = veterinarianClient;
        this.accessGuard = accessGuard;
    }

    // NOU: doar owner-ul pet-ului (sau admin) poate crea programare
    public UUID addAppointment(AppointmentPublic appointment, Jwt jwt) {
        PetPublic pet = petClient.checkPetNUserExists(appointment.getPetId());

        accessGuard.requireOwnerOrAdmin(pet.getOwnerID(), jwt);

        veterinarianClient.checkVeterinarianExists(appointment.getVeterinarianId());

        if (!appointment.getEndOfAppointment().isAfter(appointment.getStartOfAppointment())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ora de final trebuie să fie după ora de început.");
        }

        List<Appointment> overlappingAppointments =
                appointmentRepository.findByVeterinarianIdAndStartOfAppointmentLessThanAndEndOfAppointmentGreaterThan(
                        appointment.getVeterinarianId(),
                        appointment.getEndOfAppointment(),
                        appointment.getStartOfAppointment()
                );

        if (!overlappingAppointments.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Medicul veterinar are deja o programare în acest interval.");
        }

        Appointment appointmentSave = new Appointment();
        appointmentSave.setOwnerId(pet.getOwnerID());
        appointmentSave.setVeterinarianId(appointment.getVeterinarianId());
        appointmentSave.setPetId(appointment.getPetId());
        appointmentSave.setStartOfAppointment(appointment.getStartOfAppointment());
        appointmentSave.setEndOfAppointment(appointment.getEndOfAppointment());
        appointmentSave.setStatus(Status.PENDING);

        appointmentRepository.save(appointmentSave);

        return appointmentSave.getId();
    }

    // NOU: doar admin vede toate programarile din sistem
    public List<Appointment> getAllAppointments(Jwt jwt) {
        accessGuard.requireAdmin(jwt);
        return appointmentRepository.findAll();
    }

    // NOU: owner, veterinarul asignat, sau admin
    public Appointment getAppointmentById(UUID id, Jwt jwt) {
        Appointment appointment = findAppointmentOrThrow(id);
        requireInvolvedOrAdmin(appointment, jwt);
        return appointment;
    }

    // NOU: doar owner-ul respectiv sau admin (endpoint de tip "programarile mele")
    public List<Appointment> getAppointmentsByOwnerId(UUID ownerId, Jwt jwt) {
        accessGuard.requireOwnerOrAdmin(ownerId, jwt);
        return appointmentRepository.findByOwnerId(ownerId);
    }

    // NOU: doar owner-ul pet-ului sau admin
    public List<Appointment> getAppointmentsByPetId(UUID petId, Jwt jwt) {
        PetPublic pet = petClient.checkPetNUserExists(petId);
        accessGuard.requireOwnerOrAdmin(pet.getOwnerID(), jwt);
        return appointmentRepository.findByPetId(petId);
    }

    // NOU: doar veterinarul insusi sau admin (nu e public - contine programari private ale clientilor)
    public List<Appointment> getAppointmentsByVeterinarianId(UUID veterinarianId, Jwt jwt) {
        UUID vetUserId = veterinarianClient.getVeterinarianUserId(veterinarianId);
        accessGuard.requireOwnerOrAdmin(vetUserId, jwt);
        return appointmentRepository.findByVeterinarianId(veterinarianId);
    }

    /*Pt simplificare - la modificarea programarii se va sterge si se va crea una noua pentru a nu verifica 100 de cazuri de conflicte
     * de ex ora setata corect din nou, e corecta clinica? dar userul exista? coincid cei doi useri samd. E deja verificata in add*/
    // NOU: owner, veterinarul asignat, sau admin
    public Appointment updateAppointment(UUID id, Appointment updatedAppointment, Jwt jwt) {
        Appointment existingAppointment = findAppointmentOrThrow(id);
        requireInvolvedOrAdmin(existingAppointment, jwt);

        if (updatedAppointment.getOwnerId() != null) {
            // schimbarea ownerului - operatie sensibila, doar admin
            accessGuard.requireAdmin(jwt);
            existingAppointment.setOwnerId(updatedAppointment.getOwnerId());
        }

        if (updatedAppointment.getPetId() != null) {
            existingAppointment.setPetId(updatedAppointment.getPetId());
        }

        if (updatedAppointment.getVeterinarianId() != null) {
            existingAppointment.setVeterinarianId(updatedAppointment.getVeterinarianId());
        }

        if (updatedAppointment.getStartOfAppointment() != null) {
            existingAppointment.setStartOfAppointment(updatedAppointment.getStartOfAppointment());
        }

        if (updatedAppointment.getEndOfAppointment() != null) {
            existingAppointment.setEndOfAppointment(updatedAppointment.getEndOfAppointment());
        }

        if (updatedAppointment.getStatus() != null) {
            existingAppointment.setStatus(updatedAppointment.getStatus());
        }

        if (!existingAppointment.getEndOfAppointment().isAfter(existingAppointment.getStartOfAppointment())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ora de final trebuie să fie după ora de început.");
        }

        List<Appointment> overlappingAppointments =
                appointmentRepository.findByVeterinarianIdAndStartOfAppointmentLessThanAndEndOfAppointmentGreaterThan(
                        existingAppointment.getVeterinarianId(),
                        existingAppointment.getEndOfAppointment(),
                        existingAppointment.getStartOfAppointment()
                );

        boolean hasConflict = overlappingAppointments.stream()
                .anyMatch(appointment -> !appointment.getId().equals(id));

        if (hasConflict) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Medicul veterinar are deja o programare în acest interval.");
        }

        return appointmentRepository.save(existingAppointment);
    }

    // NOU: owner, veterinarul asignat, sau admin (poate anula programarea)
    public void deleteAppointment(UUID id, Jwt jwt) {
        Appointment existingAppointment = findAppointmentOrThrow(id);
        requireInvolvedOrAdmin(existingAppointment, jwt);
        appointmentRepository.delete(existingAppointment);
    }

    private Appointment findAppointmentOrThrow(UUID id) {
        return appointmentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Programarea cu ID-ul " + id + " nu a fost găsită."));
    }

    private void requireInvolvedOrAdmin(Appointment appointment, Jwt jwt) {
        UUID vetUserId = veterinarianClient.getVeterinarianUserId(appointment.getVeterinarianId());
        accessGuard.requireOneOfOrAdmin(jwt, appointment.getOwnerId(), vetUserId);
    }
}