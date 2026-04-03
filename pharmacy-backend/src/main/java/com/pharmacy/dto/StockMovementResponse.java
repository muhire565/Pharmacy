package com.pharmacy.dto;

import com.pharmacy.entity.StockMovementType;
import com.pharmacy.entity.StockReference;
import lombok.Builder;
import lombok.Value;

import java.time.Instant;

@Value
@Builder
public class StockMovementResponse {
    Long id;
    Long productId;
    String productName;
    StockMovementType type;
    Integer quantity;
    StockReference reference;
    String referenceId;
    Instant createdAt;
}
