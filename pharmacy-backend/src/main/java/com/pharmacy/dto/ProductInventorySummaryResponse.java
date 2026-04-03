package com.pharmacy.dto;

import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;
import java.time.LocalDate;

@Value
@Builder
public class ProductInventorySummaryResponse {
    Long productId;
    String name;
    String barcode;
    String category;
    BigDecimal price;
    String supplierName;
    int batchCount;
    int totalQuantity;
    /** Earliest expiry among batches that still have quantity &gt; 0, if any. */
    LocalDate nearestExpiry;
}
