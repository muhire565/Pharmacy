package com.pharmacy.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record PosDraftLineRequest(
        @NotNull Long productId,
        @NotNull @Min(1) Integer quantity
) {
}
