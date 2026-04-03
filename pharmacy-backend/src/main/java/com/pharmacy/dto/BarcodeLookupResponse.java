package com.pharmacy.dto;

import lombok.Builder;
import lombok.Value;

import java.util.List;

@Value
@Builder
public class BarcodeLookupResponse {
    ProductResponse product;
    List<BatchResponse> availableBatches;
    int totalAvailableQuantity;
}
