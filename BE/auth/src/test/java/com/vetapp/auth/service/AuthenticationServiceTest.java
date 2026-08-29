package com.vetapp.auth.service;

import com.vetapp.DTO.*;
import com.vetapp.entity.*;
import com.vetapp.repository.AuthenticationRepository;
import com.vetapp.security.AccessGuard;
import com.vetapp.service.AuthenticationService;
import com.vetapp.service.JwtService;
import com.vetapp.service.KafkaMessageProducer;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthenticationServiceTest {

    @Mock AuthenticationRepository repository;
    @Mock
    KafkaMessageProducer kafka;
    @Mock
    JwtService jwtService;
    @Mock AccessGuard accessGuard;
    @Mock Jwt jwt;

    AuthenticationService service;

    @BeforeEach
    void setUp() {
        service = new AuthenticationService(repository, kafka, jwtService, accessGuard);
    }

    private Authentication auth(UUID id, String password) {
        return new Authentication(id, "claudiu", new BCryptPasswordEncoder(4).encode(password), "c@test.com", Role.OWNER, "0711");
    }

    @Test
    void register_shouldRejectDuplicateUsername() {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("claudiu");

        when(repository.findByUsername("claudiu")).thenReturn(Optional.of(new Authentication()));

        assertEquals(HttpStatus.CONFLICT,
                assertThrows(ResponseStatusException.class, () -> service.register(request)).getStatusCode());
    }

    @Test
    void register_shouldEncryptPasswordAndPublishEvent() {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("claudiu");
        request.setPassword("Password123");
        request.setName("Claudiu");
        request.setEmail("c@test.com");
        request.setPhone("0711");
        request.setAddress("Cluj");

        UUID id = UUID.randomUUID();

        when(repository.findByUsername("claudiu")).thenReturn(Optional.empty());
        when(repository.save(any())).thenAnswer(invocation -> {
            Authentication auth = invocation.getArgument(0);
            auth.setId(id);
            return auth;
        });

        service.register(request);

        ArgumentCaptor<Authentication> captor = ArgumentCaptor.forClass(Authentication.class);
        verify(repository).save(captor.capture());

        assertEquals(Role.OWNER, captor.getValue().getRole());
        assertNotEquals("Password123", captor.getValue().getPassword());
        assertTrue(new BCryptPasswordEncoder(4).matches("Password123", captor.getValue().getPassword()));
        verify(kafka).publishUserRegistered(any());
    }

    @Test
    void login_shouldRejectWrongPassword() {
        Authentication auth = auth(UUID.randomUUID(), "Correct123");
        when(repository.findByUsername("claudiu")).thenReturn(Optional.of(auth));

        assertEquals(HttpStatus.UNAUTHORIZED,
                assertThrows(ResponseStatusException.class, () -> service.login("claudiu", "Wrong123")).getStatusCode());

        verify(jwtService, never()).generateToken(any(), any(), any());
    }

    @Test
    void login_shouldReturnJwt() {
        UUID id = UUID.randomUUID();
        Authentication auth = auth(id, "Password123");

        when(repository.findByUsername("claudiu")).thenReturn(Optional.of(auth));
        when(jwtService.generateToken(id, "claudiu", Role.OWNER)).thenReturn("jwt-token");

        AuthResponse response = service.login("claudiu", "Password123");

        assertEquals("jwt-token", response.getToken());
        assertEquals("claudiu", response.getUser().getUsername());
    }

    @Test
    void updateRole_shouldChangeRole() {
        UUID id = UUID.randomUUID();
        Authentication auth = auth(id, "Password123");
        when(repository.findById(id)).thenReturn(Optional.of(auth));

        service.updateRole(id, Role.ADMIN, jwt);

        assertEquals(Role.ADMIN, auth.getRole());
        verify(accessGuard).requireAdmin(jwt);
        verify(repository).save(auth);
    }

    @Test
    void changePassword_shouldRejectWrongCurrentPassword() {
        UUID id = UUID.randomUUID();
        Authentication auth = auth(id, "OldPassword");

        when(accessGuard.extractUserId(jwt)).thenReturn(id);
        when(repository.findById(id)).thenReturn(Optional.of(auth));

        assertEquals(HttpStatus.UNAUTHORIZED,
                assertThrows(ResponseStatusException.class,
                        () -> service.changePassword("WrongPassword", "NewPassword123", jwt)).getStatusCode());
    }

    @Test
    void changePassword_shouldSaveNewPassword() {
        UUID id = UUID.randomUUID();
        Authentication auth = auth(id, "OldPassword");

        when(accessGuard.extractUserId(jwt)).thenReturn(id);
        when(repository.findById(id)).thenReturn(Optional.of(auth));

        service.changePassword("OldPassword", "NewPassword123", jwt);

        assertTrue(new BCryptPasswordEncoder(4).matches("NewPassword123", auth.getPassword()));
        verify(repository).save(auth);
    }

    @Test
    void deleteOwnAccount_shouldDeleteAndPublishKafka() {
        UUID id = UUID.randomUUID();
        Authentication auth = auth(id, "Password123");

        when(accessGuard.extractUserId(jwt)).thenReturn(id);
        when(repository.findById(id)).thenReturn(Optional.of(auth));

        service.deleteOwnAccount(jwt);

        verify(repository).delete(auth);
        verify(kafka).publishUserDeleted(id);
    }
}