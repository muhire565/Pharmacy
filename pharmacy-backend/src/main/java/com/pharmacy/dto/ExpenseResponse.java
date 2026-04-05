package com.pharmacy.dto;

import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;
import java.time.Instant;

@Value
@Builder
public class ExpenseResponse {
    Long id;
    String title;
    String description;
    BigDecimal amount;
    Instant incurredAt;
    String recordedByUsername;
}
