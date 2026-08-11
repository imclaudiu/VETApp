package com.vetapp.service;

import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Service
public class MessageConsumer {

    private final PetService petService;

    public MessageConsumer(PetService petService) {
        this.petService = petService;
    }


    @KafkaListener(topics = "delete-owner-topic", groupId = "vetapp-group")
    public void deleteOwner(UUID ownerId) {

        try {
            petService.deleteAllPetsOwner(ownerId);
        } catch (ResponseStatusException e) {
            System.err.println("Nu s-a putut crea userul pentru " +  ": " + e.getReason());
        }
    }
}