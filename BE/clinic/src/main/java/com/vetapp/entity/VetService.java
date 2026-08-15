package com.vetapp.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

import java.util.UUID;

@Entity
public class VetService {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "clinicId", unique = false, nullable = false)
    private UUID clinicId;

    @Column(name = "serviceName", unique = false, nullable = false)
    private String serviceName;

    @Column(name = "duration", nullable = false)
    private Integer duration;

    @Column(name = "price", nullable = false)
    private Double price;

    @Column(name = "description", nullable = true)
    private String description;

    public VetService() {
    }

    public VetService(Long id, UUID clinicId, String serviceName, Integer duration, Double price, String description) {
        this.id = id;
        this.clinicId = clinicId;
        this.serviceName = serviceName;
        this.duration = duration;
        this.price = price;
        this.description = description;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public UUID getClinicId() {
        return clinicId;
    }

    public void setClinicId(UUID clinicId) {
        this.clinicId = clinicId;
    }

    public String getServiceName() {
        return serviceName;
    }

    public void setServiceName(String serviceName) {
        this.serviceName = serviceName;
    }

    public Integer getDuration() {
        return duration;
    }

    public void setDuration(Integer duration) {
        this.duration = duration;
    }

    public Double getPrice() {
        return price;
    }

    public void setPrice(Double price) {
        this.price = price;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}