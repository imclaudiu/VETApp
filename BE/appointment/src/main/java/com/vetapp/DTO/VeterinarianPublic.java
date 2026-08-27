package com.vetapp.DTO;

import java.util.UUID;

public class VeterinarianPublic {
    private UUID id;
    private UUID clinicId;

    public VeterinarianPublic() {
    }

    public VeterinarianPublic(UUID id, UUID clinicId) {
        this.id = id;
        this.clinicId = clinicId;
    }

    public UUID getClinicId() {
        return clinicId;
    }

    public void setClinicId(UUID clinicId) {
        this.clinicId = clinicId;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }
}
