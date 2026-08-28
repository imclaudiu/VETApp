//package com.vetapp.auth.service;
//
//import com.vetapp.DTO.RegisterRequest;
//import com.vetapp.entity.Authentication;
//import com.vetapp.entity.Role;
//import com.vetapp.repository.AuthenticationRepository;
//import com.vetapp.security.AccessGuard;
//import com.vetapp.service.AuthenticationService;
//import com.vetapp.service.JwtService;
//import com.vetapp.service.KafkaMessageProducer;
//import org.junit.jupiter.api.BeforeEach;
//import org.junit.jupiter.api.Test;
//import org.junit.jupiter.api.extension.ExtendWith;
//import org.mockito.ArgumentCaptor;
//import org.mockito.Mock;
//import org.mockito.junit.jupiter.MockitoExtension;
//import org.springframework.http.HttpStatus;
//import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
//import org.springframework.security.oauth2.jwt.Jwt;
//import org.springframework.web.server.ResponseStatusException;
//
//import java.util.List;
//import java.util.Optional;
//import java.util.UUID;
//
//import static org.junit.jupiter.api.Assertions.*;
//import static org.mockito.ArgumentMatchers.*;
//import static org.mockito.Mockito.*;
//
//@ExtendWith(MockitoExtension.class)
//class AuthenticationServiceTest {
//
//    @Mock
//    private AuthenticationRepository authenticationRepository;
//
//    @Mock
//    private KafkaMessageProducer kafkaMessageProducer;
//
//    @Mock
//    private JwtService jwtService;
//
//    @Mock
//    private AccessGuard accessGuard;
//
//    @Mock
//    private Jwt jwt;
//
//    private AuthenticationService authenticationService;
//
//    @BeforeEach
//    void setUp() {
//        authenticationService = new AuthenticationService(
//                authenticationRepository,
//                kafkaMessageProducer,
//                jwtService,
//                accessGuard
//        );
//    }
//
//    // =========================================================
//    // REGISTER
//    // =========================================================
//
//    @Test
//    void register_shouldThrowConflict_whenUsernameAlreadyExists() {
//
//        RegisterRequest request = mock(RegisterRequest.class);
//
//        when(request.getUsername()).thenReturn("olivia");
//
//        when(authenticationRepository.findByUsername("olivia"))
//                .thenReturn(Optional.of(new Authentication()));
//
//        ResponseStatusException exception = assertThrows(
//                ResponseStatusException.class,
//                () -> authenticationService.register(request)
//        );
//
//        assertEquals(HttpStatus.CONFLICT, exception.getStatusCode());
//
//        verify(authenticationRepository, never()).save(any());
//        verify(kafkaMessageProducer, never())
//                .publishUserRegistered(any());
//    }
//
//    @Test
//    void register_shouldSaveUserWithOwnerRoleAndEncryptedPassword() {
//
//        RegisterRequest request = mock(RegisterRequest.class);
//
//        when(request.getUsername()).thenReturn("olivia");
//        when(request.getPassword()).thenReturn("Secret123");
//        when(request.getEmail()).thenReturn("olivia@test.com");
//        when(request.getPhone()).thenReturn("0712345678");
//        when(request.getName()).thenReturn("Olivia");
//        when(request.getAddress()).thenReturn("Cluj");
//
//        when(authenticationRepository.findByUsername("olivia"))
//                .thenReturn(Optional.empty());
//
//        when(authenticationRepository.save(any(Authentication.class)))
//                .thenAnswer(invocation -> invocation.getArgument(0));
//
//        authenticationService.register(request);
//
//        ArgumentCaptor<Authentication> captor =
//                ArgumentCaptor.forClass(Authentication.class);
//
//        verify(authenticationRepository).save(captor.capture());
//
//        Authentication saved = captor.getValue();
//
//        assertEquals("olivia", saved.getUsername());
//        assertEquals("olivia@test.com", saved.getEmail());
//        assertEquals("0712345678", saved.getTelefon());
//
//        // Foarte important:
//        assertEquals(Role.OWNER, saved.getRole());
//
//        // parola NU trebuie salvată plaintext
//        assertNotEquals("Secret123", saved.getPassword());
//
//        assertTrue(
//                new BCryptPasswordEncoder(4)
//                        .matches("Secret123", saved.getPassword())
//        );
//
//        verify(kafkaMessageProducer)
//                .publishUserRegistered(any());
//    }
//
//    // =========================================================
//    // LOGIN
//    // =========================================================
//
//    @Test
//    void login_shouldThrowUnauthorized_whenUsernameDoesNotExist() {
//
//        when(authenticationRepository.findByUsername("unknown"))
//                .thenReturn(Optional.empty());
//
//        ResponseStatusException exception = assertThrows(
//                ResponseStatusException.class,
//                () -> authenticationService.login(
//                        "unknown",
//                        "password"
//                )
//        );
//
//        assertEquals(
//                HttpStatus.UNAUTHORIZED,
//                exception.getStatusCode()
//        );
//
//        verify(jwtService, never())
//                .generateToken(any(), anyString(), any());
//    }
//
//    @Test
//    void login_shouldThrowUnauthorized_whenPasswordIsIncorrect() {
//
//        Authentication authentication = new Authentication();
//
//        authentication.setUsername("olivia");
//
//        authentication.setPassword(
//                new BCryptPasswordEncoder(4)
//                        .encode("correctPassword")
//        );
//
//        when(authenticationRepository.findByUsername("olivia"))
//                .thenReturn(Optional.of(authentication));
//
//        ResponseStatusException exception = assertThrows(
//                ResponseStatusException.class,
//                () -> authenticationService.login(
//                        "olivia",
//                        "wrongPassword"
//                )
//        );
//
//        assertEquals(
//                HttpStatus.UNAUTHORIZED,
//                exception.getStatusCode()
//        );
//
//        verify(jwtService, never())
//                .generateToken(any(), anyString(), any());
//    }
//
//    @Test
//    void login_shouldGenerateJwt_whenCredentialsAreCorrect() {
//
//        Authentication authentication = new Authentication();
//
//        authentication.setUsername("olivia");
//        authentication.setEmail("olivia@test.com");
//        authentication.setTelefon("0712345678");
//        authentication.setRole(Role.OWNER);
//
//        authentication.setPassword(
//                new BCryptPasswordEncoder(4)
//                        .encode("Secret123")
//        );
//
//        when(authenticationRepository.findByUsername("olivia"))
//                .thenReturn(Optional.of(authentication));
//
//        when(jwtService.generateToken(
//                authentication.getId(),
//                "olivia",
//                Role.OWNER
//        )).thenReturn("fake.jwt.token");
//
//        assertDoesNotThrow(
//                () -> authenticationService.login(
//                        "olivia",
//                        "Secret123"
//                )
//        );
//
//        verify(jwtService).generateToken(
//                authentication.getId(),
//                "olivia",
//                Role.OWNER
//        );
//    }
//
//    // =========================================================
//    // GET ALL
//    // =========================================================
//
//    @Test
//    void getAll_shouldRequireAdmin() {
//
//        when(authenticationRepository.findAll())
//                .thenReturn(List.of());
//
//        authenticationService.getAll(jwt);
//
//        verify(accessGuard).requireAdmin(jwt);
//        verify(authenticationRepository).findAll();
//    }
//
//    @Test
//    void getAll_shouldReturnAllAccounts() {
//
//        Authentication auth1 = new Authentication();
//        Authentication auth2 = new Authentication();
//
//        when(authenticationRepository.findAll())
//                .thenReturn(List.of(auth1, auth2));
//
//        List<Authentication> result =
//                authenticationService.getAll(jwt);
//
//        assertEquals(2, result.size());
//
//        verify(accessGuard).requireAdmin(jwt);
//    }
//
//    // =========================================================
//    // GET BY ID
//    // =========================================================
//
//    @Test
//    void getAuthById_shouldThrowNotFound_whenUserDoesNotExist() {
//
//        UUID id = UUID.randomUUID();
//
//        when(authenticationRepository.findById(id))
//                .thenReturn(Optional.empty());
//
//        ResponseStatusException exception = assertThrows(
//                ResponseStatusException.class,
//                () -> authenticationService.getAuthById(id, jwt)
//        );
//
//        assertEquals(
//                HttpStatus.NOT_FOUND,
//                exception.getStatusCode()
//        );
//
//        verify(accessGuard)
//                .requireOwnerOrAdmin(id, jwt);
//    }
//
//    // =========================================================
//    // UPDATE
//    // =========================================================
//
//    @Test
//    void updateAuth_shouldThrowConflict_whenNewUsernameAlreadyExists() {
//
//        UUID userId = UUID.randomUUID();
//        UUID anotherUserId = UUID.randomUUID();
//
//        Authentication existing = new Authentication();
//
//        Authentication updated = new Authentication();
//        updated.setUsername("newUsername");
//
//        Authentication otherUser = mock(Authentication.class);
//
//        when(otherUser.getId())
//                .thenReturn(anotherUserId);
//
//        when(authenticationRepository.findById(userId))
//                .thenReturn(Optional.of(existing));
//
//        when(authenticationRepository.findByUsername("newUsername"))
//                .thenReturn(Optional.of(otherUser));
//
//        ResponseStatusException exception = assertThrows(
//                ResponseStatusException.class,
//                () -> authenticationService.updateAuth(
//                        userId,
//                        updated,
//                        jwt
//                )
//        );
//
//        assertEquals(
//                HttpStatus.CONFLICT,
//                exception.getStatusCode()
//        );
//
//        verify(authenticationRepository, never())
//                .save(existing);
//    }
//
//    @Test
//    void updateAuth_shouldUpdateOnlyProvidedFields() {
//
//        UUID id = UUID.randomUUID();
//
//        Authentication existing = new Authentication();
//
//        existing.setUsername("oldUsername");
//        existing.setEmail("old@email.com");
//        existing.setTelefon("0700000000");
//        existing.setRole(Role.OWNER);
//
//        Authentication update = new Authentication();
//
//        // modificăm DOAR email-ul
//        update.setEmail("new@email.com");
//
//        when(authenticationRepository.findById(id))
//                .thenReturn(Optional.of(existing));
//
//        when(authenticationRepository.save(existing))
//                .thenReturn(existing);
//
//        authenticationService.updateAuth(id, update, jwt);
//
//        assertEquals(
//                "oldUsername",
//                existing.getUsername()
//        );
//
//        assertEquals(
//                "new@email.com",
//                existing.getEmail()
//        );
//
//        assertEquals(
//                "0700000000",
//                existing.getTelefon()
//        );
//
//        // Rolul nu trebuie modificat de updateAuth
//        assertEquals(
//                Role.OWNER,
//                existing.getRole()
//        );
//
//        verify(accessGuard)
//                .requireOwnerOrAdmin(id, jwt);
//
//        verify(authenticationRepository)
//                .save(existing);
//    }
//
//    // =========================================================
//    // DELETE
//    // =========================================================
//
//    @Test
//    void deleteAuth_shouldRequireAdminAndDeleteUser() {
//
//        UUID id = UUID.randomUUID();
//
//        Authentication authentication =
//                new Authentication();
//
//        when(authenticationRepository.findById(id))
//                .thenReturn(Optional.of(authentication));
//
//        authenticationService.deleteAuth(id, jwt);
//
//        verify(accessGuard)
//                .requireAdmin(jwt);
//
//        verify(authenticationRepository)
//                .delete(authentication);
//
//        verify(kafkaMessageProducer)
//                .publishUserDeleted(id);
//    }
//
//    @Test
//    void deleteAuth_shouldThrowNotFound_whenUserDoesNotExist() {
//
//        UUID id = UUID.randomUUID();
//
//        when(authenticationRepository.findById(id))
//                .thenReturn(Optional.empty());
//
//        ResponseStatusException exception = assertThrows(
//                ResponseStatusException.class,
//                () -> authenticationService.deleteAuth(id, jwt)
//        );
//
//        assertEquals(
//                HttpStatus.NOT_FOUND,
//                exception.getStatusCode()
//        );
//
//        verify(authenticationRepository, never())
//                .delete(any());
//    }
//
//    // =========================================================
//    // DELETE ALL
//    // =========================================================
//
//    @Test
//    void deleteAll_shouldRequireAdmin() {
//
//        authenticationService.deleteAll(jwt);
//
//        verify(accessGuard)
//                .requireAdmin(jwt);
//
//        verify(authenticationRepository)
//                .deleteAll();
//    }
//
//    // =========================================================
//    // UPDATE ROLE
//    // =========================================================
//
//    @Test
//    void updateRole_shouldRequireAdminAndChangeRole() {
//
//        UUID id = UUID.randomUUID();
//
//        Authentication authentication =
//                new Authentication();
//
//        authentication.setRole(Role.OWNER);
//
//        when(authenticationRepository.findById(id))
//                .thenReturn(Optional.of(authentication));
//
//        authenticationService.updateRole(
//                id,
//                Role.ADMIN,
//                jwt
//        );
//
//        assertEquals(
//                Role.ADMIN,
//                authentication.getRole()
//        );
//
//        verify(accessGuard)
//                .requireAdmin(jwt);
//
//        verify(authenticationRepository)
//                .save(authentication);
//    }
//
//    @Test
//    void updateRole_shouldThrowNotFound_whenUserDoesNotExist() {
//
//        UUID id = UUID.randomUUID();
//
//        when(authenticationRepository.findById(id))
//                .thenReturn(Optional.empty());
//
//        ResponseStatusException exception = assertThrows(
//                ResponseStatusException.class,
//                () -> authenticationService.updateRole(
//                        id,
//                        Role.ADMIN,
//                        jwt
//                )
//        );
//
//        assertEquals(
//                HttpStatus.NOT_FOUND,
//                exception.getStatusCode()
//        );
//
//        verify(authenticationRepository, never())
//                .save(any());
//    }
//}