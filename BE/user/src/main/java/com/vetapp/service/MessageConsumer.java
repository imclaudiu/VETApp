package com.vetapp.service;

import com.vetapp.DTO.UserRegistrationEvent;
import com.vetapp.entity.RolUser;
import com.vetapp.entity.Users;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Service
public class MessageConsumer {

    private final UserService userService;

    public MessageConsumer(UserService userService) {
        this.userService = userService;
    }

    @KafkaListener(topics = "register-topic", groupId = "vetapp-group")
    public void createAccount(UserRegistrationEvent event) {
        System.out.println("Received registration event: " + event.getId());

        try {
            Users user = new Users(
                    event.getId(),
                    event.getName(),
                    event.getEmail(),
                    event.getPhone(),
                    event.getAddress(),
                    RolUser.PROPRIETAR
            );
            userService.addUser(user);
        } catch (ResponseStatusException e) {
            // conflict (nume/email/telefon duplicat) - nu are rost să reîncercăm
            System.err.println("Nu s-a putut crea userul pentru " + event.getId() + ": " + e.getReason());
        }
    }

    @KafkaListener(topics = "delete-topic", groupId = "vetapp-group")
    public void deleteAccount(UUID id){
        System.out.println("Received UUID: " + id);
        try{userService.deleteUser(id);}
        catch (ResponseStatusException e){
            System.err.println("Nu s-a putut sterge userul: " + e.getReason());
        }
    }
}