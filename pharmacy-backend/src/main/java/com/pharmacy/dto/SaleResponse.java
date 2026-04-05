package com.pharmacy.dto;

import com.pharmacy.entity.PaymentMethod;
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
    PaymentMethod paymentMethod;
    Instant createdAt;
    String cashierUsername;
    List<SaleItemResponse> items;
}
