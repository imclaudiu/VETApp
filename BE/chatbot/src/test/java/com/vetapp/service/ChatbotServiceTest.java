package com.vetapp.service;

import com.vetapp.DTO.*;
import org.junit.jupiter.api.*;
import org.springframework.http.*;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

class ChatbotServiceTest {

	ChatbotService service;
	MockRestServiceServer server;

	@BeforeEach
	void setUp() {
		RestClient.Builder builder = RestClient.builder();
		server = MockRestServiceServer.bindTo(builder).build();
		service = new ChatbotService(builder.baseUrl("http://openai.test").build(), "test-model");
	}

	@Test
	void ask_shouldRejectNullRequest() {
		assertEquals(HttpStatus.BAD_REQUEST,
				assertThrows(ResponseStatusException.class, () -> service.ask(null)).getStatusCode());
	}

	@Test
	void ask_shouldRejectEmptyConversation() {
		assertEquals(HttpStatus.BAD_REQUEST,
				assertThrows(ResponseStatusException.class, () -> service.ask(new ChatRequest(List.of()))).getStatusCode());
	}

	@Test
	void ask_shouldRequireLastMessageFromUser() {
		ChatRequest request = new ChatRequest(List.of(new ChatMessage("assistant", "Hello")));

		assertEquals(HttpStatus.BAD_REQUEST,
				assertThrows(ResponseStatusException.class, () -> service.ask(request)).getStatusCode());
	}

	@Test
	void ask_shouldRejectMessageOver4000Characters() {
		ChatRequest request = new ChatRequest(List.of(new ChatMessage("user", "a".repeat(4001))));

		assertEquals(HttpStatus.BAD_REQUEST,
				assertThrows(ResponseStatusException.class, () -> service.ask(request)).getStatusCode());
	}

	@Test
	void ask_shouldReturnOpenAiText() {
		server.expect(requestTo("http://openai.test/responses"))
				.andRespond(withSuccess("""
                        {
                          "output": [{
                            "type": "message",
                            "content": [{
                              "type": "output_text",
                              "text": "Raspuns de test"
                            }]
                          }]
                        }
                        """, MediaType.APPLICATION_JSON));

		ChatResponse response = service.ask(new ChatRequest(List.of(new ChatMessage("user", "Pisica mea nu mananca"))));

		assertEquals("Raspuns de test", response.answer());
		server.verify();
	}

	@Test
	void ask_shouldReturnBadGatewayWhenOpenAiFails() {
		server.expect(requestTo("http://openai.test/responses")).andRespond(withServerError());

		assertEquals(HttpStatus.BAD_GATEWAY,
				assertThrows(ResponseStatusException.class,
						() -> service.ask(new ChatRequest(List.of(new ChatMessage("user", "Test"))))).getStatusCode());
	}
}