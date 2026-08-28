package com.vetapp.service;

import com.vetapp.DTO.NotificationEvent;
import com.vetapp.entity.Notification;
import com.vetapp.repository.NotificationRepository;
import com.vetapp.security.AccessGuard;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

@Service
public class NotificationService {
    private final NotificationRepository repository;
    private final AccessGuard accessGuard;

    public NotificationService(NotificationRepository repository, AccessGuard accessGuard) {
        this.repository = repository;
        this.accessGuard = accessGuard;
    }

    public void create(NotificationEvent event) {
        repository.save(new Notification(event.recipientUserId(), event.type(), event.title(), event.message(), event.relatedId(), LocalDateTime.now(ZoneId.of("Europe/Bucharest"))));
    }

    public List<Notification> getMine(Jwt jwt) {
        return repository.findByRecipientUserIdOrderByCreatedAtDesc(accessGuard.extractUserId(jwt));
    }

    public long getUnreadCount(Jwt jwt) {
        return repository.countByRecipientUserIdAndReadFalse(accessGuard.extractUserId(jwt));
    }

    public void markRead(UUID id, Jwt jwt) {
        Notification notification = repository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notificarea nu a fost găsită."));
        if (!notification.getRecipientUserId().equals(accessGuard.extractUserId(jwt))) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Nu ai acces la această notificare.");
        notification.setRead(true);
        repository.save(notification);
    }

    public void markAllRead(Jwt jwt) {
        List<Notification> notifications = repository.findByRecipientUserIdOrderByCreatedAtDesc(accessGuard.extractUserId(jwt));
        notifications.forEach(n -> n.setRead(true));
        repository.saveAll(notifications);
    }
}