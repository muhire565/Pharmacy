package com.pharmacy.dto;

import lombok.Builder;
import lombok.Value;

import java.time.LocalDate;

@Value
@Builder
public class ExpiringBatchResponse {
    Long batchId;
    Long productId;
    String productName;
    String batchNumber;
    LocalDate expiryDate;
    Integer quantity;
    long daysUntilExpiry;
}
