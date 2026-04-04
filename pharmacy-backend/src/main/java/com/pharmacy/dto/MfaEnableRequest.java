package com.pharmacy.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class MfaEnableRequest {

    @NotBlank
    private String code;
}
