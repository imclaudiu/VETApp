package com.vetapp.service;

import tools.jackson.databind.JsonNode;
import com.vetapp.DTO.ChatMessage;
import com.vetapp.DTO.ChatRequest;
import com.vetapp.DTO.ChatResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class ChatbotService {

    private final RestClient openAiRestClient;
    private final String model;

    private static final int MAX_MESSAGES = 10;
    private static final int MAX_MESSAGE_LENGTH = 4000;

    private static final String SYSTEM_PROMPT = """
            You are VETApp AI Assistant, an assistant intended for pet owners.

            Your role is to provide clear, useful general veterinary information.

            Rules:
            - Answer in the same language as the user.
            - Focus on pets and veterinary topics.
            - Explain information in simple language.
            - Explain the information in a short message. Just the main ideas.
            - Do not claim that you have performed a veterinary diagnosis.
            - Do not invent medical test results.
            - Do not prescribe prescription medication or provide unsafe medication dosages.
            - When symptoms may represent an emergency, clearly recommend immediate veterinary care.
            - Emergency warning signs include severe difficulty breathing, loss of consciousness,
              repeated seizures, major bleeding, suspected poisoning, severe trauma,
              inability to urinate, severe abdominal swelling, or rapid deterioration.
            - If there is not enough information, explain what additional information would be useful.
            - For questions unrelated to animals or veterinary care, explain politely that your
              purpose is to assist with pet-related questions.
             - Never tell the user that a diagnosis is certain based only on chat messages.
             - Clearly distinguish general information from veterinary diagnosis.
              - Do not unnecessarily alarm the user when symptoms appear mild.
            """;

    public ChatbotService(RestClient openAiRestClient, @Value("${openai.model}") String model) {
        this.openAiRestClient = openAiRestClient;
        this.model = model;
    }

    public ChatResponse ask(ChatRequest request) {
        List<ChatMessage> messages = validateAndPrepareMessages(request);

        List<Map<String, String>> input = new ArrayList<>();

        for (ChatMessage message : messages) {
            Map<String, String> inputMessage = new LinkedHashMap<>();
            inputMessage.put("role", message.role());
            inputMessage.put("content", message.content());
            input.add(inputMessage);
        }

        Map<String, Object> body = new LinkedHashMap<>();

        body.put("model", model);

        body.put("instructions", SYSTEM_PROMPT);

        body.put("input", input);

        body.put("max_output_tokens", 1200);

        try {

            JsonNode response = openAiRestClient.post().uri("/responses").body(body).retrieve().body(JsonNode.class);

            String answer = extractAnswer(response);
            return new ChatResponse(answer);
        } catch (RestClientException exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Serviciul AI nu este disponibil momentan."
            );
        }
    }

    private List<ChatMessage> validateAndPrepareMessages(
            ChatRequest request
    ) {
        if (request == null || request.messages() == null || request.messages().isEmpty()) {

            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Conversația nu poate fi goală.");
        }

        List<ChatMessage> validMessages = request.messages().stream().filter(message -> message != null && message.content() != null && !message.content().isBlank())
                        .filter(message -> "user".equals(message.role()) || "assistant".equals(message.role()))
                        .toList();

        if (validMessages.isEmpty()) {

            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nu există mesaje valide.");
        }

        ChatMessage lastMessage =
                validMessages.get(validMessages.size() - 1);

        if (!"user".equals(lastMessage.role())) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Ultimul mesaj trebuie să aparțină utilizatorului."
            );
        }

        for (ChatMessage message : validMessages) {

            if (message.content().length() > MAX_MESSAGE_LENGTH) {

                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Mesajul este prea lung."
                );
            }
        }

        int startIndex =
                Math.max(
                        0,
                        validMessages.size() - MAX_MESSAGES
                );

        return validMessages.subList(
                startIndex,
                validMessages.size()
        );
    }

    private String extractAnswer(
            JsonNode response
    ) {

        if (response == null) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "AI-ul nu a returnat un răspuns."
            );
        }

        StringBuilder result =
                new StringBuilder();

        JsonNode output =
                response.path("output");

        for (JsonNode item : output) {

            if (!"message".equals(
                    item.path("type").asText()
            )) {
                continue;
            }

            JsonNode content =
                    item.path("content");

            for (JsonNode contentItem : content) {

                if ("output_text".equals(
                        contentItem.path("type").asText()
                )) {

                    String text =
                            contentItem.path("text").asText();

                    if (!text.isBlank()) {

                        if (!result.isEmpty()) {
                            result.append("\n");
                        }

                        result.append(text);
                    }
                }
            }
        }

        if (result.isEmpty()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "AI-ul nu a generat un răspuns text."
            );
        }

        return result.toString();
    }
}