package com.pharmacy.dto;

import com.pharmacy.entity.TreasuryMovementType;
import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;
import java.time.Instant;

@Value
@Builder
public class TreasuryMovementResponse {
    Long id;
    TreasuryMovementType type;
    BigDecimal amount;
    String note;
    Instant createdAt;
    String recordedByUsername;
}
