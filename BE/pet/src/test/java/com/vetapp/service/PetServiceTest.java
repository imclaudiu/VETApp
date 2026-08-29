package com.vetapp.service;

import com.vetapp.client.UserClient;
import com.vetapp.entity.Pet;
import com.vetapp.repository.PetRepository;
import com.vetapp.security.AccessGuard;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PetServiceTest {

    @Mock PetRepository repository;
    @Mock UserClient userClient;
    @Mock AccessGuard accessGuard;
    @Mock Jwt jwt;

    PetService service;

    @BeforeEach
    void setUp() {
        service = new PetService(repository, userClient, accessGuard);
    }

    private Pet pet(UUID id, UUID owner) {
        return new Pet(id, owner, "Luna", "Cat", "European", LocalDate.of(2022, 1, 1), "F");
    }

    @Test
    void addPet_shouldSave() {
        UUID id = UUID.randomUUID(), owner = UUID.randomUUID();
        Pet pet = pet(id, owner);

        when(repository.existsById(id)).thenReturn(false);
        when(repository.save(pet)).thenReturn(pet);

        assertEquals(id, service.addPet(pet, jwt));

        verify(accessGuard).requireOwnerOrAdmin(owner, jwt);
        verify(userClient).checkUserExists(owner);
        verify(repository).save(pet);
    }

    @Test
    void addPet_shouldRejectDuplicateId() {
        UUID id = UUID.randomUUID(), owner = UUID.randomUUID();
        Pet pet = pet(id, owner);
        when(repository.existsById(id)).thenReturn(true);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> service.addPet(pet, jwt));

        assertEquals(HttpStatus.CONFLICT, ex.getStatusCode());
        verify(repository, never()).save(any());
    }

    @Test
    void getPetById_shouldCheckAccess() {
        UUID id = UUID.randomUUID(), owner = UUID.randomUUID();
        when(repository.findById(id)).thenReturn(Optional.of(pet(id, owner)));

        service.getPetById(id, jwt);

        verify(accessGuard).requireOwnerVeterinarianOrAdmin(owner, jwt);
    }

    @Test
    void updatePet_shouldUpdateProvidedFields() {
        UUID id = UUID.randomUUID(), owner = UUID.randomUUID();
        Pet existing = pet(id, owner);
        Pet update = new Pet();
        update.setName("Cedar");

        when(repository.findById(id)).thenReturn(Optional.of(existing));
        when(repository.save(existing)).thenReturn(existing);

        Pet result = service.updatePet(id, update, jwt);

        assertEquals("Cedar", result.getName());
        assertEquals("Cat", result.getSpecies());
        verify(accessGuard).requireVeterinarianOrAdmin(jwt);
    }

    @Test
    void deletePet_shouldDelete() {
        UUID id = UUID.randomUUID();
        Pet pet = pet(id, UUID.randomUUID());
        when(repository.findById(id)).thenReturn(Optional.of(pet));

        service.deletePet(id, jwt);

        verify(accessGuard).requireVeterinarianOrAdmin(jwt);
        verify(repository).delete(pet);
    }

    @Test
    void deleteAllPetsOwner_shouldRemoveOwner() {
        UUID owner = UUID.randomUUID();
        Pet p1 = pet(UUID.randomUUID(), owner);
        Pet p2 = pet(UUID.randomUUID(), owner);
        when(repository.findAllByOwnerID(owner)).thenReturn(List.of(p1, p2));

        service.deleteAllPetsOwner(owner);

        assertNull(p1.getOwnerID());
        assertNull(p2.getOwnerID());
        verify(repository).saveAll(List.of(p1, p2));
    }

    @Test
    void getMyPets_shouldUseJwtUserId() {
        UUID owner = UUID.randomUUID();
        when(accessGuard.extractUserId(jwt)).thenReturn(owner);
        when(repository.findAllByOwnerID(owner)).thenReturn(List.of());

        service.getMyPets(jwt);

        verify(repository).findAllByOwnerID(owner);
    }
}