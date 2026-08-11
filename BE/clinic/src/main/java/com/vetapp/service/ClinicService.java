package com.vetapp.service;

import com.vetapp.entity.Clinic;
import com.vetapp.repository.ClinicRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
public class ClinicService {

    private final ClinicRepository clinicRepository;

    public ClinicService(ClinicRepository clinicRepository) {
        this.clinicRepository = clinicRepository;
    }

    public UUID addClinic(Clinic clinic) {
        clinicRepository.save(clinic);
        return clinic.getId();
    }

    public List<Clinic> getAllClinics() {
        return clinicRepository.findAll();
    }

    public List<Clinic> getClinicsByCity(String city){
        List<Clinic> clinicList = clinicRepository.findByCityIgnoreCase(city)
                .orElseThrow(()->new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Error:" + city));

        if(clinicList.isEmpty()){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }

        return clinicList;
    }

    public Clinic getClinicById(UUID id) {
        return clinicRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Clinica cu ID-ul " + id + " nu a fost găsită."
                ));
    }

    public Clinic updateClinic(UUID id, Clinic updatedClinic) {

        Clinic existingClinic = clinicRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Clinica cu ID-ul " + id + " nu a fost găsită."
                ));

        existingClinic.setName(updatedClinic.getName());
        existingClinic.setAddress(updatedClinic.getAddress());
        existingClinic.setCity(updatedClinic.getCity());
        existingClinic.setPhone(updatedClinic.getPhone());
        existingClinic.setRating(updatedClinic.getRating());

        return clinicRepository.save(existingClinic);
    }

    public void deleteClinic(UUID id) {

        Clinic existingClinic = clinicRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Clinica cu ID-ul " + id + " nu a fost găsită."
                ));

        clinicRepository.delete(existingClinic);
    }
}