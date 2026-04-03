package com.pharmacy.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Value;

@Value
public class OwnerPharmacyUpdateRequest {
    @NotBlank
    @Size(max = 100)
    String name;

    @NotBlank
    @Size(min = 2, max = 2)
    String countryCode;

    @NotBlank
    @Size(max = 20)
    String phoneE164;

    @NotBlank
    @Email
    @Size(max = 255)
    String email;

    @NotBlank
    @Size(max = 250)
    String address;
}

