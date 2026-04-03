package com.pharmacy.dto;

import lombok.Builder;
import lombok.Value;

import java.time.Instant;

@Value
@Builder
public class AuditLogResponse {
    Long id;
    String action;
    String entityType;
    String entityId;
    String username;
    String details;
    Instant createdAt;
}
