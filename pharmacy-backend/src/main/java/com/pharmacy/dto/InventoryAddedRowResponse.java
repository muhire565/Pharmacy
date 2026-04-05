package com.pharmacy.dto;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class InventoryAddedRowResponse {
    long productId;
    String productName;
    long quantityAdded;
}
