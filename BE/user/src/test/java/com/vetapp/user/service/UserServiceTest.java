package com.vetapp.user.service;

import com.vetapp.DTO.UserProfile;
import com.vetapp.entity.Users;
import com.vetapp.repository.UserRepository;
import com.vetapp.security.AccessGuard;
import com.vetapp.service.KafkaMessageProducer;
import com.vetapp.service.UserService;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock UserRepository repository;
    @Mock
    KafkaMessageProducer kafka;
    @Mock AccessGuard accessGuard;
    @Mock Jwt jwt;

    UserService service;

    @BeforeEach
    void setUp() {
        service = new UserService(repository, kafka, accessGuard);
    }

    @Test
    void addUser_shouldSaveAndReturnId() {
        UUID id = UUID.randomUUID();
        Users user = new Users(id, "Claudiu", "c@test.com", "0711", "Cluj");

        assertEquals(id, service.addUser(user));
        verify(repository).save(user);
    }

    @Test
    void getAllUsers_shouldRequireAdmin() {
        when(repository.findAll()).thenReturn(List.of());

        service.getAllUsers(jwt);

        verify(accessGuard).requireAdmin(jwt);
        verify(repository).findAll();
    }

    @Test
    void getUserById_shouldThrowNotFound() {
        UUID id = UUID.randomUUID();
        when(repository.findById(id)).thenReturn(Optional.empty());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> service.getUserById(id, jwt));

        assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
        verify(accessGuard).requireOwnerOrAdmin(id, jwt);
    }

    @Test
    void updateUser_shouldUpdateFields() {
        UUID id = UUID.randomUUID();
        Users existing = new Users(id, "Old", "old@test.com", "0700", "Old address");
        Users update = new Users(null, "New", "new@test.com", "0711", "New address");

        when(repository.findById(id)).thenReturn(Optional.of(existing));
        when(repository.findByName("New")).thenReturn(Optional.empty());
        when(repository.findByEmail("new@test.com")).thenReturn(Optional.empty());
        when(repository.findByPhone("0711")).thenReturn(Optional.empty());
        when(repository.save(existing)).thenReturn(existing);

        Users result = service.updateUser(id, update, jwt);

        assertEquals("New", result.getName());
        assertEquals("new@test.com", result.getEmail());
        assertEquals("0711", result.getPhone());
        assertEquals("New address", result.getAddress());
    }

    @Test
    void updateUser_shouldRejectDuplicateEmail() {
        UUID id = UUID.randomUUID();
        Users existing = new Users(id, "Claudiu", "old@test.com", "0700", "Cluj");
        Users duplicate = new Users(UUID.randomUUID(), "Other", "used@test.com", "0799", "Brasov");
        Users update = new Users(null, "Claudiu", "used@test.com", "0700", "Cluj");

        when(repository.findById(id)).thenReturn(Optional.of(existing));
        when(repository.findByName("Claudiu")).thenReturn(Optional.of(existing));
        when(repository.findByEmail("used@test.com")).thenReturn(Optional.of(duplicate));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> service.updateUser(id, update, jwt));

        assertEquals(HttpStatus.CONFLICT, ex.getStatusCode());
        verify(repository, never()).save(any());
    }

    @Test
    void deleteUserInternal_shouldDeleteAndPublishKafka() {
        UUID id = UUID.randomUUID();
        Users user = new Users();
        when(repository.findById(id)).thenReturn(Optional.of(user));

        service.deleteUserInternal(id);

        verify(repository).delete(user);
        verify(kafka).publishUserDeleted(id);
    }

    @Test
    void getMyProfile_shouldUseJwtUserId() {
        UUID id = UUID.randomUUID();
        Users user = new Users(id, "Claudiu", "c@test.com", "0711", "Cluj");

        when(accessGuard.extractUserId(jwt)).thenReturn(id);
        when(repository.findById(id)).thenReturn(Optional.of(user));

        UserProfile profile = service.getMyProfile(jwt);

        assertEquals(id, profile.getId());
        assertEquals("Claudiu", profile.getName());
        assertEquals("c@test.com", profile.getEmail());
    }
}