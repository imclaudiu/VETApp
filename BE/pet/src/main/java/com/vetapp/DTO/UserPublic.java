package com.vetapp.DTO;

import java.util.UUID;

public class UserPublic {
    private UUID id;
    private String name;

    public UserPublic() {
    }

    public UserPublic(UUID id, String name) {
        this.id = id;
        this.name = name;
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

    @Override
    public String toString() {
        return "UserPublic{" +
                "id=" + id +
                ", name='" + name + '\'' +
                '}';
    }
}
