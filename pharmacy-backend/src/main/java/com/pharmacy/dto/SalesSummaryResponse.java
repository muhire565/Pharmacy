package com.pharmacy.dto;

import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Value
@Builder
public class SalesSummaryResponse {
    Instant from;
    Instant to;
    BigDecimal totalAmount;
    long saleCount;
    List<SaleResponse> sales;
}
