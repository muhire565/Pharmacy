package com.pharmacy.dto;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class ReportPharmacyHeaderResponse {
    String name;
    String address;
    String phoneE164;
    String email;
    String currencyCode;
}
