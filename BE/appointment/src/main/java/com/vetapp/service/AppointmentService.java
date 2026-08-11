package com.vetapp.service;

import com.vetapp.entity.Appointment;
import com.vetapp.repository.AppointmentRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;

    public AppointmentService(AppointmentRepository appointmentRepository) {
        this.appointmentRepository = appointmentRepository;
    }

    public UUID addAppointment(Appointment appointment) {

        if (!appointment.getEndOfAppointment()
                .isAfter(appointment.getStartOfAppointment())) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Ora de final trebuie să fie după ora de început."
            );
        }

        List<Appointment> overlappingAppointments =
                appointmentRepository
                        .findByVeterinarianIdAndStartOfAppointmentLessThanAndEndOfAppointmentGreaterThan(
                                appointment.getVeterinarianId(),
                                appointment.getEndOfAppointment(),
                                appointment.getStartOfAppointment()
                        );

        if (!overlappingAppointments.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Medicul veterinar are deja o programare în acest interval."
            );
        }

        appointmentRepository.save(appointment);

        return appointment.getId();
    }

    public List<Appointment> getAllAppointments() {
        return appointmentRepository.findAll();
    }

    public Appointment getAppointmentById(UUID id) {

        return appointmentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Programarea cu ID-ul " + id + " nu a fost găsită."
                ));
    }

    public List<Appointment> getAppointmentsByOwnerId(UUID ownerId) {
        return appointmentRepository.findByOwnerId(ownerId);
    }

    public List<Appointment> getAppointmentsByPetId(UUID petId) {
        return appointmentRepository.findByPetId(petId);
    }

    public List<Appointment> getAppointmentsByVeterinarianId(UUID veterinarianId) {
        return appointmentRepository.findByVeterinarianId(veterinarianId);
    }

    public Appointment updateAppointment(
            UUID id,
            Appointment updatedAppointment) {

        Appointment existingAppointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Programarea cu ID-ul " + id + " nu a fost găsită."
                ));

        if (updatedAppointment.getOwnerId() != null) {
            existingAppointment.setOwnerId(updatedAppointment.getOwnerId());
        }

        if (updatedAppointment.getPetId() != null) {
            existingAppointment.setPetId(updatedAppointment.getPetId());
        }

        if (updatedAppointment.getVeterinarianId() != null) {
            existingAppointment.setVeterinarianId(
                    updatedAppointment.getVeterinarianId()
            );
        }

        if (updatedAppointment.getVetServiceId() != null) {
            existingAppointment.setVetServiceId(
                    updatedAppointment.getVetServiceId()
            );
        }

        if (updatedAppointment.getStartOfAppointment() != null) {
            existingAppointment.setStartOfAppointment(
                    updatedAppointment.getStartOfAppointment()
            );
        }

        if (updatedAppointment.getEndOfAppointment() != null) {
            existingAppointment.setEndOfAppointment(
                    updatedAppointment.getEndOfAppointment()
            );
        }

        if (updatedAppointment.getServiceName() != null) {
            existingAppointment.setServiceName(
                    updatedAppointment.getServiceName()
            );
        }

        if (updatedAppointment.getStatus() != null) {
            existingAppointment.setStatus(
                    updatedAppointment.getStatus()
            );
        }


        // verificăm dacă intervalul este valid
        if (!existingAppointment.getEndOfAppointment()
                .isAfter(existingAppointment.getStartOfAppointment())) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Ora de final trebuie să fie după ora de început."
            );
        }


        // verificăm dacă noul interval se suprapune
        // cu altă programare a aceluiași medic
        List<Appointment> overlappingAppointments =
                appointmentRepository
                        .findByVeterinarianIdAndStartOfAppointmentLessThanAndEndOfAppointmentGreaterThan(
                                existingAppointment.getVeterinarianId(),
                                existingAppointment.getEndOfAppointment(),
                                existingAppointment.getStartOfAppointment()
                        );

        boolean hasConflict = overlappingAppointments.stream()
                .anyMatch(appointment ->
                        !appointment.getId().equals(id)
                );

        if (hasConflict) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Medicul veterinar are deja o programare în acest interval."
            );
        }

        return appointmentRepository.save(existingAppointment);
    }

    public void deleteAppointment(UUID id) {

        Appointment existingAppointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Programarea cu ID-ul " + id + " nu a fost găsită."
                ));

        appointmentRepository.delete(existingAppointment);
    }
}