package com.vetapp.controller;

import com.vetapp.entity.Notification;
import com.vetapp.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/notification")
public class NotificationController {
    private final NotificationService service;

    public NotificationController(NotificationService service) {
        this.service = service;
    }

    @GetMapping("/mine")
    public ResponseEntity<List<Notification>> getMine(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(service.getMine(jwt));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(Map.of("count", service.getUnreadCount(jwt)));
    }

    @PatchMapping("/read/{id}")
    public ResponseEntity<Void> markRead(@PathVariable UUID id, @AuthenticationPrincipal Jwt jwt) {
        service.markRead(id, jwt);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/read-all")
    public ResponseEntity<Void> markAllRead(@AuthenticationPrincipal Jwt jwt) {
        service.markAllRead(jwt);
        return ResponseEntity.noContent().build();
    }
}