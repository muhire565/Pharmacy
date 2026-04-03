package com.pharmacy.dto;

import java.math.BigDecimal;

public record PosDraftLineResponse(
        Long productId,
        String name,
        String barcode,
        BigDecimal price,
        Integer quantity
) {
}
