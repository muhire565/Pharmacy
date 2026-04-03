package com.pharmacy.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SaleLineRequest {

    private Long productId;

    private String barcode;

    @NotNull
    @Min(1)
    private Integer quantity;

    @AssertTrue(message = "Either productId or barcode must be provided")
    public boolean isProductOrBarcode() {
        boolean hasId = productId != null;
        boolean hasBc = barcode != null && !barcode.isBlank();
        return hasId || hasBc;
    }
}
