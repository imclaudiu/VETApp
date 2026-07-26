package com.vetapp.service;

import com.vetapp.entity.Authentication;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
public class MessageConsumer {

    @KafkaListener(topics = "my-topic", groupId = "user-service-group")
    public void listen(Authentication message) {
        System.out.println("Received message: " + message.getId() + " - " + message.getUsername());
    }
}