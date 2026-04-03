package com.pharmacy.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class BatchRequest {

    @NotNull
    private Long productId;

    @NotBlank
    @Size(max = 80)
    private String batchNumber;

    @NotNull
    @Future(message = "Expiry date must be in the future")
    private LocalDate expiryDate;

    @NotNull
    @Min(0)
    private Integer quantity;

    @NotNull
    @DecimalMin(value = "0.0", inclusive = true)
    private BigDecimal costPrice;
}
