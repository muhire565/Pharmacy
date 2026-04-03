package com.pharmacy.dto;

import lombok.Builder;
import lombok.Value;

import java.time.Instant;

@Value
@Builder
public class OwnerPharmacyResponse {
    Long id;
    String name;
    String countryCode;
    String phoneE164;
    String email;
    String address;
    boolean locked;
    String lockedReason;
    Instant lockedAt;
    Instant createdAt;
    String logoUrl;
}

