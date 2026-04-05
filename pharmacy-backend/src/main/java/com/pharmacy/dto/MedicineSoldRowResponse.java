package com.pharmacy.dto;

import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;

@Value
@Builder
public class MedicineSoldRowResponse {
    long productId;
    String productName;
    long quantitySold;
    BigDecimal lineTotal;
}
