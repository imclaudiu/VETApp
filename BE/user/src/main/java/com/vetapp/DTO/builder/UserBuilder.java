package com.vetapp.DTO.builder;

import com.vetapp.DTO.UserPublic;
import com.vetapp.entity.Users;

public class UserBuilder {
    public static UserPublic toPublicUser(Users users){
        return new UserPublic(users.getId(), users.getName());
    }
}
