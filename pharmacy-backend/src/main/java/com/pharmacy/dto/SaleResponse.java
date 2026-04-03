package com.pharmacy.dto;

import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Value
@Builder
public class SaleResponse {
    Long id;
    BigDecimal totalAmount;
    Instant createdAt;
    String cashierUsername;
    List<SaleItemResponse> items;
}
