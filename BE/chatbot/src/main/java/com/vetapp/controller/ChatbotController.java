package com.vetapp.controller;

import com.vetapp.DTO.ChatRequest;
import com.vetapp.DTO.ChatResponse;
import com.vetapp.security.AccessGuard;
import com.vetapp.service.ChatbotService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/chatbot")
public class ChatbotController {

    private final ChatbotService chatbotService;
    private final AccessGuard accessGuard;

    public ChatbotController(
            ChatbotService chatbotService,
            AccessGuard accessGuard
    ) {
        this.chatbotService = chatbotService;
        this.accessGuard = accessGuard;
    }

    @PostMapping("/ask")
    public ChatResponse ask(
            @RequestBody ChatRequest request,
            @AuthenticationPrincipal Jwt jwt
    ) {

        accessGuard.requireOwner(jwt);

        return chatbotService.ask(request);
    }
}