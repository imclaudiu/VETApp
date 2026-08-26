package com.vetapp.service;

import com.vetapp.DTO.builder.*;
import com.vetapp.client.ClinicClient;
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
import com.vetapp.client.ClinicClient;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;

import java.util.List;
import java.util.UUID;

@Service
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final PetClient petClient;
    private final VeterinarianClient veterinarianClient;
    private final AccessGuard accessGuard;
    private final ClinicClient clinicClient;

    public AppointmentService(AppointmentRepository appointmentRepository, PetClient petClient, VeterinarianClient veterinarianClient, AccessGuard accessGuard, ClinicClient clinicClient) {
        this.appointmentRepository = appointmentRepository;
        this.petClient = petClient;
        this.veterinarianClient = veterinarianClient;
        this.accessGuard = accessGuard;
        this.clinicClient = clinicClient;
    }

    public UUID addAppointment(AppointmentPublic appointment, Jwt jwt) {

        if (appointment.getPetId() == null || appointment.getVeterinarianId() == null || appointment.getVetServiceId() == null
                || appointment.getStartOfAppointment() == null) {

            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Datele programării sunt incomplete.");
        }


        PetPublic pet = petClient.checkPetNUserExists(appointment.getPetId());
        accessGuard.requireOwnerOrAdmin(pet.getOwnerID(), jwt);

        boolean petAlreadyHasAppointment = appointmentRepository.existsByPetIdAndStatusInAndEndOfAppointmentAfter(appointment.getPetId(),
                                List.of(
                                        Status.PENDING,
                                        Status.CONFIRMED
                                ), LocalDateTime.now()
                        );


        if (petAlreadyHasAppointment) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Acest animal are deja o programare activă.");
        }

        VeterinarianPublic veterinarian = veterinarianClient.checkVeterinarianExists(appointment.getVeterinarianId());
        VetServicePublic service = clinicClient.getService(appointment.getVetServiceId());

        if (!service.getClinicId().equals(veterinarian.getClinicId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Serviciul nu aparține clinicii medicului selectat.");
        }

        LocalDateTime start = appointment.getStartOfAppointment();

        if (!start.isAfter(LocalDateTime.now())) {throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Programarea trebuie să fie în viitor.");}


        LocalDateTime end = start.plusMinutes(service.getDuration()
                );


        /*
         * Verificăm programul de lucru.
         */
        AvailabilityPublic availability = clinicClient.getAvailability(appointment.getVeterinarianId(), start.toLocalDate());


        if (start.toLocalTime().isBefore(availability.getStartHour()) || end.toLocalTime().isAfter(availability.getEndHour())
        ) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Programarea este în afara programului medicului."
            );
        }


        /*
         * Verificăm programările existente.
         */
        List<Appointment> overlaps = appointmentRepository.findByVeterinarianIdAndStartOfAppointmentLessThanAndEndOfAppointmentGreaterThan(appointment.getVeterinarianId(), end, start);


        boolean conflict = overlaps.stream().anyMatch(existing -> existing.getStatus() != Status.CANCELED);


        if (conflict) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Medicul veterinar are deja o programare în acest interval.");
        }
        Appointment appointmentSave = new Appointment();
        appointmentSave.setOwnerId(pet.getOwnerID());
        appointmentSave.setPetId(appointment.getPetId());
        appointmentSave.setVeterinarianId(appointment.getVeterinarianId());

        appointmentSave.setVetServiceId(appointment.getVetServiceId());

        appointmentSave.setStartOfAppointment(start);

        appointmentSave.setEndOfAppointment(end);

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

    public List<LocalDateTime> getAvailableSlots(UUID veterinarianId, Long vetServiceId, LocalDate day
    ) {
        VeterinarianPublic veterinarian = veterinarianClient.checkVeterinarianExists(veterinarianId);

        VetServicePublic service = clinicClient.getService(vetServiceId);

        if (!service.getClinicId().equals(veterinarian.getClinicId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Serviciul nu aparține clinicii medicului."
            );
        }


        AvailabilityPublic availability = clinicClient.getAvailability(veterinarianId, day);
        LocalDateTime workStart = LocalDateTime.of(day, availability.getStartHour());
        LocalDateTime workEnd = LocalDateTime.of(day, availability.getEndHour());
        List<Appointment> appointments = appointmentRepository.findByVeterinarianIdAndStartOfAppointmentLessThanAndEndOfAppointmentGreaterThan(veterinarianId, workEnd, workStart);
        List<LocalDateTime> slots = new ArrayList<>();
        int duration = service.getDuration();

        LocalDateTime current = workStart;
        while (!current.plusMinutes(duration).isAfter(workEnd)
        ) {
            LocalDateTime slotStart = current;
            LocalDateTime slotEnd = current.plusMinutes(duration);
            boolean inPast = !slotStart.isAfter(LocalDateTime.now());
            boolean conflict = appointments.stream().filter(appointment -> appointment.getStatus() != Status.CANCELED)
                            .anyMatch(appointment ->
                                    appointment.getStartOfAppointment().isBefore(slotEnd) && appointment.getEndOfAppointment().isAfter(slotStart));
            if (!inPast && !conflict) {slots.add(slotStart);}
            current = current.plusMinutes(30);}

        return slots;
    }
    public Appointment cancelAppointment(UUID id, Jwt jwt) {
        Appointment appointment = findAppointmentOrThrow(id);

        accessGuard.requireOwnerOrAdmin(appointment.getOwnerId(), jwt);

        if (appointment.getStatus() == Status.CANCELED) {

            throw new ResponseStatusException(HttpStatus.CONFLICT, "Programarea este deja anulată.");
        }

        if (appointment.getStatus() == Status.FINISHED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "O programare finalizată nu poate fi anulată.");
        }


        if (appointment.getStatus() == Status.NO_SHOW) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Această programare nu mai poate fi anulată."
            );
        }


        /*
         * Nu permitem anularea după începerea programării.
         */
        if (!appointment.getStartOfAppointment().isAfter(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Programarea nu mai poate fi anulată deoarece a început deja.");
        }


        appointment.setStatus(
                Status.CANCELED
        );


        return appointmentRepository.save(
                appointment
        );
    }

}