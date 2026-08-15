package com.vetapp.service;

import com.vetapp.entity.Clinic;
import com.vetapp.entity.VetService;
import com.vetapp.repository.VetServiceRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
public class VetServiceService {

    private final VetServiceRepository vetServiceRepository;
    private final ClinicService clinicService;

    public VetServiceService(VetServiceRepository vetServiceRepository, ClinicService clinicService) {
        this.vetServiceRepository = vetServiceRepository;
        this.clinicService = clinicService;
    }

    public Long addService(VetService vetService) {
        clinicService.getClinicById(vetService.getClinicId());

        boolean exists = vetServiceRepository.existsByClinicIdAndServiceNameIgnoreCase(vetService.getClinicId(),
                vetService.getServiceName());

        if(exists){
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Serviciul cu numele " + vetService.getServiceName()
                            + " există deja în această clinică."
            );
        }

        vetServiceRepository.save(vetService);
        return vetService.getId();
    }

    public List<VetService> getAllServices() {
        return vetServiceRepository.findAll();
    }

    public VetService getServiceById(Long id) {
        return vetServiceRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Serviciul cu ID-ul " + id + " nu a fost găsit."
                ));
    }

    public List<VetService> getServicesByClinicId(UUID clinicId) {
        return vetServiceRepository.findByClinicId(clinicId);
    }

    public VetService updateService(Long id, VetService updatedVetService) {

        VetService existingVetService = vetServiceRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Serviciul cu ID-ul " + id + " nu a fost găsit."
                ));

        if (updatedVetService.getClinicId() != null) {
            existingVetService.setClinicId(updatedVetService.getClinicId());
        }

        if (updatedVetService.getServiceName() != null) {
            existingVetService.setServiceName(updatedVetService.getServiceName());
        }

        if (updatedVetService.getDuration() != null) {
            existingVetService.setDuration(updatedVetService.getDuration());
        }

        if (updatedVetService.getPrice() != null) {
            existingVetService.setPrice(updatedVetService.getPrice());
        }

        if (updatedVetService.getDescription() != null) {
            existingVetService.setDescription(updatedVetService.getDescription());
        }

        return vetServiceRepository.save(existingVetService);
    }

    public void deleteService(Long id) {

        VetService existingVetService = vetServiceRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Serviciul cu ID-ul " + id + " nu a fost găsit."
                ));

        vetServiceRepository.delete(existingVetService);
    }
}