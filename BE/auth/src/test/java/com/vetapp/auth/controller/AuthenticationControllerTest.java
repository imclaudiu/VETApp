package com.vetapp.controller;

import com.vetapp.DTO.AuthResponse;
import com.vetapp.DTO.AuthenticationPublic;
import com.vetapp.DTO.RegisterRequest;
import com.vetapp.entity.Authentication;
import com.vetapp.entity.Role;
import com.vetapp.service.AuthenticationService;
import com.vetapp.service.KafkaMessageProducer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.jwt.Jwt;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthenticationControllerTest {

    @Mock
    private AuthenticationService authenticationService;

    @Mock
    private KafkaMessageProducer kafkaMessageProducer;

    @Mock
    private Jwt jwt;

    private AuthenticationController controller;

    @BeforeEach
    void setUp() {
        controller = new AuthenticationController(
                authenticationService,
                kafkaMessageProducer
        );
    }

    @Test
    void register_shouldReturn201Created() {

        RegisterRequest request =
                mock(RegisterRequest.class);

        AuthenticationPublic response =
                mock(AuthenticationPublic.class);

        when(authenticationService.register(request))
                .thenReturn(response);

        ResponseEntity<AuthenticationPublic> result =
                controller.register(request);

        assertEquals(
                HttpStatus.CREATED,
                result.getStatusCode()
        );

        assertSame(response, result.getBody());

        verify(authenticationService)
                .register(request);
    }

    @Test
    void login_shouldReturn200Ok() {

        AuthenticationController.LoginRequest request =
                new AuthenticationController.LoginRequest(
                        "olivia",
                        "Secret123"
                );

        AuthResponse authResponse =
                mock(AuthResponse.class);

        when(authenticationService.login(
                "olivia",
                "Secret123"
        )).thenReturn(authResponse);

        ResponseEntity<AuthResponse> result =
                controller.login(request);

        assertEquals(
                HttpStatus.OK,
                result.getStatusCode()
        );

        assertSame(
                authResponse,
                result.getBody()
        );

        verify(authenticationService)
                .login(
                        "olivia",
                        "Secret123"
                );
    }

    @Test
    void getAll_shouldReturn200Ok() {

        List<Authentication> users =
                List.of(
                        new Authentication(),
                        new Authentication()
                );

        when(authenticationService.getAll(jwt))
                .thenReturn(users);

        ResponseEntity<List<Authentication>> result =
                controller.getAll(jwt);

        assertEquals(
                HttpStatus.OK,
                result.getStatusCode()
        );

        assertEquals(
                2,
                result.getBody().size()
        );

        verify(authenticationService)
                .getAll(jwt);
    }

    @Test
    void deleteAuth_shouldReturn204NoContent() {

        UUID id = UUID.randomUUID();

        ResponseEntity<Void> response =
                controller.deleteAuth(id, jwt);

        assertEquals(
                HttpStatus.NO_CONTENT,
                response.getStatusCode()
        );

        verify(authenticationService)
                .deleteAuth(id, jwt);
    }

    @Test
    void deleteAll_shouldReturn200Ok() {

        ResponseEntity<Void> response =
                controller.deleteAll(jwt);

        assertEquals(
                HttpStatus.OK,
                response.getStatusCode()
        );

        verify(authenticationService)
                .deleteAll(jwt);
    }

    @Test
    void updateRole_shouldReturn200AndCallService() {

        UUID id = UUID.randomUUID();

        AuthenticationController.UpdateRoleRequest request =
                new AuthenticationController.UpdateRoleRequest(
                        Role.ADMIN
                );

        ResponseEntity<Void> response =
                controller.updateRole(
                        id,
                        request,
                        jwt
                );

        assertEquals(
                HttpStatus.OK,
                response.getStatusCode()
        );

        verify(authenticationService)
                .updateRole(
                        id,
                        Role.ADMIN,
                        jwt
                );
    }
}