package com.vetapp.DTO;


import java.util.UUID;

public class ClinicPublic {
    private UUID id;
    private String name;

    public ClinicPublic() {
    }

    public ClinicPublic(UUID id, String name) {
        this.id = id;
        this.name = name;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }
}
