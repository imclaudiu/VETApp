package com.vetapp.DTO;

import com.vetapp.entity.RolUser;

import java.util.UUID;

public class UserPublic {
    private UUID id;
    private String name;
    private RolUser rol;

    public UserPublic() {
    }

    public UserPublic(UUID id, String name, RolUser rol) {
        this.id = id;
        this.name = name;
        this.rol = rol;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public RolUser getRol() {
        return rol;
    }

    public void setRol(RolUser rol) {
        this.rol = rol;
    }
}
