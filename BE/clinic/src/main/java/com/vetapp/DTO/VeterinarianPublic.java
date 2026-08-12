package com.vetapp.DTO;

import java.util.UUID;

public class VeterinarianPublic {

    private UUID id;
    private UUID userId;
    private UUID clinicId;
    private String name;
    private Boolean surgeon;

    public VeterinarianPublic() {
    }

    public VeterinarianPublic(UUID id, UUID userId, UUID clinicId, String name, Boolean surgeon) {
        this.id = id;
        this.userId = userId;
        this.clinicId = clinicId;
        this.name = name;
        this.surgeon = surgeon;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public UUID getClinicId() {
        return clinicId;
    }

    public void setClinicId(UUID clinicId) {
        this.clinicId = clinicId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Boolean getSurgeon() {
        return surgeon;
    }

    public void setSurgeon(Boolean surgeon) {
        this.surgeon = surgeon;
    }
}