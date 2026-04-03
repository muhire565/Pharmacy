package com.pharmacy.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ProductRequest {

    @NotBlank
    @Size(max = 255)
    private String name;

    @Size(max = 5000)
    private String description;

    @Size(max = 120)
    private String category;

    /** If blank, the server assigns a unique internal barcode (PH-…). */
    @Size(max = 64)
    private String barcode;

    @NotNull
    @DecimalMin(value = "0.01", inclusive = true, message = "Price must be greater than 0")
    private BigDecimal price;

    private Long supplierId;
}
