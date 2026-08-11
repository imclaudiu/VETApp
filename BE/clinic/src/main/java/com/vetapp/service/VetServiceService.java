package com.vetapp.service;

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

    public VetServiceService(VetServiceRepository vetServiceRepository) {
        this.vetServiceRepository = vetServiceRepository;
    }

    public Long addService(VetService vetService) {
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

    public VetService updateService(
            Long id,
            VetService updatedVetService) {

        VetService existingVetService = vetServiceRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Serviciul cu ID-ul " + id + " nu a fost găsit."
                ));

        existingVetService.setClinicId(updatedVetService.getClinicId());
        existingVetService.setServiceName(updatedVetService.getServiceName());
        existingVetService.setDuration(updatedVetService.getDuration());
        existingVetService.setPrice(updatedVetService.getPrice());
        existingVetService.setDescription(updatedVetService.getDescription());

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