package com.vetapp.service;

import com.vetapp.DTO.*;
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

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
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
    private static final ZoneId APP_ZONE = ZoneId.of("Europe/Bucharest");
    private final NotificationProducer notificationProducer;


    public AppointmentService(AppointmentRepository appointmentRepository, PetClient petClient, VeterinarianClient veterinarianClient, AccessGuard accessGuard, ClinicClient clinicClient, NotificationProducer notificationProducer) {
        this.appointmentRepository = appointmentRepository;
        this.petClient = petClient;
        this.veterinarianClient = veterinarianClient;
        this.accessGuard = accessGuard;
        this.clinicClient = clinicClient;
        this.notificationProducer = notificationProducer;
    }

    private void notify(UUID userId, String type, String title, String message, UUID relatedId) {
        notificationProducer.send(new NotificationEvent(userId, type, title, message, relatedId));
    }

    private LocalDateTime now(){
        return LocalDateTime.now(APP_ZONE);
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
                                ), now()
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

        if (!start.isAfter(now())) {throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Programarea trebuie să fie în viitor.");}


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

        UUID vetUserId = veterinarianClient.getVeterinarianUserId(appointmentSave.getVeterinarianId());
        notify(vetUserId, "APPOINTMENT_CREATED", "New appointment", "A new appointment was requested for " + pet.getName() + " on " + start + ".", appointmentSave.getId());


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

    public List<VeterinarianAppointmentPublic> getAppointmentsByVeterinarianId(UUID veterinarianId, Jwt jwt) {
        UUID vetUserId = veterinarianClient.getVeterinarianUserId(veterinarianId);
        accessGuard.requireOwnerOrAdmin(vetUserId, jwt);

        return appointmentRepository.findByVeterinarianId(veterinarianId)
                .stream()
                .map(this::toVeterinarianAppointmentPublic)
                .toList();
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
            boolean inPast = !slotStart.isAfter(now());
            boolean conflict = appointments.stream().filter(appointment -> appointment.getStatus() != Status.CANCELED)
                            .anyMatch(appointment ->
                                    appointment.getStartOfAppointment().isBefore(slotEnd) && appointment.getEndOfAppointment().isAfter(slotStart));
            if (!inPast && !conflict) {slots.add(slotStart);}
            current = current.plusMinutes(30);}

        return slots;
    }
    public Appointment cancelAppointment(UUID id, Jwt jwt) {
        Appointment appointment = findAppointmentOrThrow(id);

        requireInvolvedOrAdmin(appointment, jwt);

        if (appointment.getStatus() != Status.PENDING && appointment.getStatus() != Status.CONFIRMED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Doar programările PENDING sau CONFIRMED pot fi anulate.");
        }

        if (!appointment.getStartOfAppointment().isAfter(now())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Programarea nu mai poate fi anulată deoarece a început deja.");
        }

        appointment.setStatus(Status.CANCELED);
        Appointment saved = appointmentRepository.save(appointment);

        UUID actorId = accessGuard.extractUserId(jwt);
        UUID vetUserId = veterinarianClient.getVeterinarianUserId(saved.getVeterinarianId());

        if (accessGuard.isAdmin(jwt)) {
            notify(saved.getOwnerId(), "APPOINTMENT_CANCELED", "Appointment canceled", "Your appointment on " + saved.getStartOfAppointment() + " was canceled.", saved.getId());
            notify(vetUserId, "APPOINTMENT_CANCELED", "Appointment canceled", "The appointment on " + saved.getStartOfAppointment() + " was canceled.", saved.getId());
        } else if (actorId.equals(saved.getOwnerId())) {
            notify(vetUserId, "APPOINTMENT_CANCELED", "Appointment canceled", "The owner canceled the appointment on " + saved.getStartOfAppointment() + ".", saved.getId());
        } else {
            notify(saved.getOwnerId(), "APPOINTMENT_CANCELED", "Appointment canceled", "The veterinarian canceled your appointment on " + saved.getStartOfAppointment() + ".", saved.getId());
        }

        return saved;
    }

    private VeterinarianAppointmentPublic toVeterinarianAppointmentPublic(Appointment appointment) {
        PetPublic pet = petClient.getPetInternal(appointment.getPetId());

        String serviceName = "Veterinary appointment";

        if (appointment.getVetServiceId() != null) {
            try {
                VetServicePublic service = clinicClient.getService(appointment.getVetServiceId());
                serviceName = service.getServiceName();
            } catch (Exception ignored) {
            }
        }

        return new VeterinarianAppointmentPublic(
                appointment.getId(),
                appointment.getPetId(),
                pet.getName(),
                pet.getSpecies(),
                pet.getRace(),
                pet.getSex(),
                appointment.getVetServiceId(),
                serviceName,
                appointment.getStartOfAppointment(),
                appointment.getEndOfAppointment(),
                appointment.getStatus()
        );
    }

    public Appointment confirmAppointment(UUID id, Jwt jwt) {
        Appointment appointment = findAppointmentOrThrow(id);

        UUID vetUserId = veterinarianClient.getVeterinarianUserId(appointment.getVeterinarianId());
        accessGuard.requireOwnerOrAdmin(vetUserId, jwt);

        if (appointment.getStatus() != Status.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Doar programările PENDING pot fi confirmate.");
        }

        if (!appointment.getStartOfAppointment().isAfter(now())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Programarea nu mai poate fi confirmată deoarece a început deja.");
        }

        appointment.setStatus(Status.CONFIRMED);
        Appointment saved = appointmentRepository.save(appointment);
        notify(saved.getOwnerId(), "APPOINTMENT_CONFIRMED", "Appointment confirmed", "Your appointment on " + saved.getStartOfAppointment() + " was confirmed.", saved.getId());
        return saved;
    }

    public Appointment markNoShow(UUID id, Jwt jwt) {
        Appointment appointment = findAppointmentOrThrow(id);

        UUID vetUserId = veterinarianClient.getVeterinarianUserId(appointment.getVeterinarianId());
        accessGuard.requireOwnerOrAdmin(vetUserId, jwt);

        if (appointment.getStatus() != Status.PENDING && appointment.getStatus() != Status.CONFIRMED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Această programare nu poate fi marcată NO_SHOW.");
        }

        if (appointment.getStartOfAppointment().isAfter(now())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Programarea nu poate fi marcată NO_SHOW înainte de ora programată.");
        }

        appointment.setStatus(Status.NO_SHOW);
        Appointment saved = appointmentRepository.save(appointment);
        notify(saved.getOwnerId(), "APPOINTMENT_NO_SHOW", "Missed appointment", "Your appointment on " + saved.getStartOfAppointment() + " was marked as no-show.", saved.getId());
        return saved;
    }

    public Appointment getAppointmentInternal(UUID id) {
        return findAppointmentOrThrow(id);
    }

    public void finishAppointmentInternal(UUID id) {
        Appointment appointment = findAppointmentOrThrow(id);

        if (appointment.getStatus() != Status.CONFIRMED) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Doar o programare CONFIRMED poate fi finalizată."
            );
        }

        if (appointment.getStartOfAppointment().isAfter(now())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Programarea nu poate fi finalizată înainte să înceapă."
            );
        }

        appointment.setStatus(Status.FINISHED);
        appointmentRepository.save(appointment);
    }

}