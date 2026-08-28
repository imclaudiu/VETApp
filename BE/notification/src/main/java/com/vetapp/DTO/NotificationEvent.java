package com.vetapp.DTO;

import java.util.UUID;

public record NotificationEvent(UUID recipientUserId, String type, String title, String message, UUID relatedId) {}