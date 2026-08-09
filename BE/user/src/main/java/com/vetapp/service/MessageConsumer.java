package com.vetapp.service;

import com.vetapp.DTO.UserRegistrationEvent;
import com.vetapp.entity.RolUser;
import com.vetapp.entity.Users;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

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
                    RolUser.PROPRIETAR // sau ce rol implicit vrei la înregistrare din frontend
            );
            userService.addUser(user);
        } catch (ResponseStatusException e) {
            // conflict (nume/email/telefon duplicat) - nu are rost să reîncercăm
            System.err.println("Nu s-a putut crea userul pentru " + event.getId() + ": " + e.getReason());
        }
    }
}