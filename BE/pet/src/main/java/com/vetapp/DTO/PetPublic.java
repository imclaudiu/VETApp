package com.vetapp.DTO;

import java.util.Date;
import java.util.UUID;

public class PetPublic {
    private UUID id;
    private UUID ownerID;
    private String name;
    private String species;
    private String race;
    private Date dob;
    private String sex;

    public PetPublic() {
    }

    public PetPublic(
            UUID id,
            UUID ownerID,
            String name,
            String species,
            String race,
            Date dob,
            String sex
    ) {
        this.id = id;
        this.ownerID = ownerID;
        this.name = name;
        this.species = species;
        this.race = race;
        this.dob = dob;
        this.sex = sex;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getOwnerID() {
        return ownerID;
    }

    public void setOwnerID(UUID ownerID) {
        this.ownerID = ownerID;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getSpecies() {
        return species;
    }

    public void setSpecies(String species) {
        this.species = species;
    }

    public String getRace() {
        return race;
    }

    public void setRace(String race) {
        this.race = race;
    }

    public Date getDob() {
        return dob;
    }

    public void setDob(Date dob) {
        this.dob = dob;
    }

    public String getSex() {
        return sex;
    }

    public void setSex(String sex) {
        this.sex = sex;
    }
}
