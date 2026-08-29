package com.vetapp.service;

import com.vetapp.DTO.NotificationEvent;
import com.vetapp.entity.Notification;
import com.vetapp.repository.NotificationRepository;
import com.vetapp.security.AccessGuard;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

	@Mock NotificationRepository repository;
	@Mock AccessGuard accessGuard;
	@Mock Jwt jwt;

	NotificationService service;

	@BeforeEach
	void setUp() {
		service = new NotificationService(repository, accessGuard);
	}

	@Test
	void create_shouldSaveUnreadNotification() {
		UUID userId = UUID.randomUUID();
		NotificationEvent event = new NotificationEvent(userId, "TEST", "Title", "Message", UUID.randomUUID());

		service.create(event);

		ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
		verify(repository).save(captor.capture());

		assertEquals(userId, captor.getValue().getRecipientUserId());
		assertFalse(captor.getValue().isRead());
	}

	@Test
	void getMine_shouldUseJwtUserId() {
		UUID userId = UUID.randomUUID();
		when(accessGuard.extractUserId(jwt)).thenReturn(userId);

		service.getMine(jwt);

		verify(repository).findByRecipientUserIdOrderByCreatedAtDesc(userId);
	}

	@Test
	void getUnreadCount_shouldReturnRepositoryCount() {
		UUID userId = UUID.randomUUID();
		when(accessGuard.extractUserId(jwt)).thenReturn(userId);
		when(repository.countByRecipientUserIdAndReadFalse(userId)).thenReturn(4L);

		assertEquals(4, service.getUnreadCount(jwt));
	}

	@Test
	void markRead_shouldMarkNotificationRead() {
		UUID id = UUID.randomUUID(), userId = UUID.randomUUID();
		Notification notification = new Notification(userId, "TEST", "Title", "Message", null, LocalDateTime.now());

		when(repository.findById(id)).thenReturn(Optional.of(notification));
		when(accessGuard.extractUserId(jwt)).thenReturn(userId);

		service.markRead(id, jwt);

		assertTrue(notification.isRead());
		verify(repository).save(notification);
	}

	@Test
	void markRead_shouldRejectOtherUsersNotification() {
		UUID id = UUID.randomUUID();

		Notification notification = new Notification(UUID.randomUUID(), "TEST", "Title", "Message", null, LocalDateTime.now());

		when(repository.findById(id)).thenReturn(Optional.of(notification));
		when(accessGuard.extractUserId(jwt)).thenReturn(UUID.randomUUID());

		assertEquals(HttpStatus.FORBIDDEN,
				assertThrows(ResponseStatusException.class, () -> service.markRead(id, jwt)).getStatusCode());

		verify(repository, never()).save(any());
	}

	@Test
	void markAllRead_shouldMarkEverything() {
		UUID userId = UUID.randomUUID();

		Notification n1 = new Notification(userId, "A", "A", "A", null, LocalDateTime.now());
		Notification n2 = new Notification(userId, "B", "B", "B", null, LocalDateTime.now());

		when(accessGuard.extractUserId(jwt)).thenReturn(userId);
		when(repository.findByRecipientUserIdOrderByCreatedAtDesc(userId)).thenReturn(List.of(n1, n2));

		service.markAllRead(jwt);

		assertTrue(n1.isRead());
		assertTrue(n2.isRead());
		verify(repository).saveAll(List.of(n1, n2));
	}
}