package com.pharmacy.dto;

import com.pharmacy.entity.PaymentMethod;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class SaleRequest {

    @NotEmpty
    @Valid
    private List<SaleLineRequest> items;

    /** Defaults to CASH when omitted (backward compatible). */
    private PaymentMethod paymentMethod;
}
