package com.vetapp.service;

import com.vetapp.entity.Authentication;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
public class KafkaMessageProducer {

    private final KafkaTemplate<String, Authentication> kafkaTemplate;

    public KafkaMessageProducer(KafkaTemplate<String, Authentication> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void sendMessage(Authentication authentication) {
        kafkaTemplate.send("my-topic", authentication); }
}