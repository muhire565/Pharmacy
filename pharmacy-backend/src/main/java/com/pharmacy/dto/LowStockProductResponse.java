package com.pharmacy.dto;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class LowStockProductResponse {
    Long productId;
    String name;
    String barcode;
    long totalQuantity;
}
