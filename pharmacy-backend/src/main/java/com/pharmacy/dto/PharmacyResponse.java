package com.pharmacy.dto;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class PharmacyResponse {
    Long id;
    String name;
    String countryCode;
    String phoneE164;
    String email;
    String address;
    String currencyCode;
    String logoUrl;
    String defaultCashierEmail;
    String defaultCashierPassword;
}
