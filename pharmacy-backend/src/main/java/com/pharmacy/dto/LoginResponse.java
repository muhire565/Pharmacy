package com.pharmacy.dto;

import com.pharmacy.entity.Role;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class LoginResponse {
    String token;
    String tokenType;
    long expiresInMs;
    String email;
    Role role;
    Long pharmacyId;
    String pharmacyName;
    String logoUrl;
    /** ISO 4217 when user belongs to a pharmacy; null for system owner */
    String currencyCode;
}
