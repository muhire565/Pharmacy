package com.pharmacy.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SupplierRequest {

    @NotBlank
    @Size(max = 200)
    private String name;

    @Size(max = 500)
    private String contact;

    @Size(max = 40)
    private String phone;
}
