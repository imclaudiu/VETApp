package com.vetapp.DTO;

import java.util.List;

public record ChatRequest(
        List<ChatMessage> messages
) {
}