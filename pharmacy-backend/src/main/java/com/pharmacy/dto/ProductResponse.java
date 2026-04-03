package com.pharmacy.dto;

import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;
import java.time.Instant;

@Value
@Builder
public class ProductResponse {
    Long id;
    String name;
    String description;
    String category;
    String barcode;
    BigDecimal price;
    Long supplierId;
    String supplierName;
    Instant createdAt;
}
