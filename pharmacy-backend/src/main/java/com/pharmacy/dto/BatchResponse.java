package com.pharmacy.dto;

import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Value
@Builder
public class BatchResponse {
    Long id;
    Long productId;
    String productName;
    String batchNumber;
    LocalDate expiryDate;
    Integer quantity;
    BigDecimal costPrice;
    Instant createdAt;
}
