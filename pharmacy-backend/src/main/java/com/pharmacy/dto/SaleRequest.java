package com.pharmacy.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class SaleRequest {

    @NotEmpty
    @Valid
    private List<SaleLineRequest> items;
}
