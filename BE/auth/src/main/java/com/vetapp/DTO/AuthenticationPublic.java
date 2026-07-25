package com.vetapp.DTO;

import java.util.UUID;

public class AuthenticationPublic {
    private String username;

    public AuthenticationPublic() {
    }

    public AuthenticationPublic(String username){
        this.username = username;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }
}
