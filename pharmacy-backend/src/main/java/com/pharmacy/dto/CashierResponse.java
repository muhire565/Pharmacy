package com.pharmacy.dto;

import lombok.Builder;
import lombok.Value;

import java.time.Instant;

@Value
@Builder
public class CashierResponse {
    Long id;
    String email;
    String username;
    Instant createdAt;
}
