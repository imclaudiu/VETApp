package com.vetapp.service;

import com.vetapp.DTO.NotificationEvent;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
public class MessageConsumer {
    private final NotificationService notificationService;

    public MessageConsumer(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @KafkaListener(topics = "notification-topic", groupId = "notification-group")
    public void consume(NotificationEvent event) {
        notificationService.create(event);
    }
}