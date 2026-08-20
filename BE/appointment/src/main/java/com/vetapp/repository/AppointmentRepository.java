package com.vetapp.repository;

import com.vetapp.entity.Appointment;
import com.vetapp.entity.Status;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface AppointmentRepository extends JpaRepository<Appointment, UUID> {

    List<Appointment> findByOwnerId(UUID ownerId);

    List<Appointment> findByPetId(UUID petId);

    List<Appointment> findByVeterinarianId(UUID veterinarianId);

    List<Appointment> findByVeterinarianIdAndStartOfAppointmentLessThanAndEndOfAppointmentGreaterThan(
            UUID veterinarianId,
            LocalDateTime endOfAppointment,
            LocalDateTime startOfAppointment
    );

    boolean existsByPetIdAndStatusInAndEndOfAppointmentAfter(UUID petId, List<Status> statuses, LocalDateTime dateTime
    );
}