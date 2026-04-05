package com.pharmacy.dto;

import com.pharmacy.entity.TreasuryMovementType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class TreasuryMovementRequest {

    @NotNull
    private TreasuryMovementType type;

    @NotNull
    @DecimalMin(value = "0.01", inclusive = true)
    private BigDecimal amount;

    @Size(max = 500)
    private String note;
}
