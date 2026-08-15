package com.vetapp.DTO.builder;

import java.time.LocalDate;
import java.util.UUID;

public class PetPublic {
    private UUID ownerID;
    private String name;
    private String species;
    private String race;
    private LocalDate dob;
    private String sex;

    public PetPublic() {
    }

    public PetPublic(UUID ownerID, String name, String species, String race, LocalDate dob, String sex) {
        this.ownerID = ownerID;
        this.name = name;
        this.species = species;
        this.race = race;
        this.dob = dob;
        this.sex = sex;
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

    public LocalDate getDob() {
        return dob;
    }

    public void setDob(LocalDate dob) {
        this.dob = dob;
    }

    public String getSex() {
        return sex;
    }

    public void setSex(String sex) {
        this.sex = sex;
    }
}
