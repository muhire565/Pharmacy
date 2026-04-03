package com.pharmacy.dto;

import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;

@Value
@Builder
public class SaleItemResponse {
    Long productId;
    String productName;
    Long batchId;
    String batchNumber;
    Integer quantity;
    BigDecimal unitPrice;
    BigDecimal lineTotal;
}
