package com.pharmacy.dto;

import lombok.Builder;
import lombok.Value;

import java.time.Instant;

@Value
@Builder
public class SupplierResponse {
    Long id;
    String name;
    String contact;
    String phone;
    Instant createdAt;
}
