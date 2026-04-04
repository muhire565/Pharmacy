package com.pharmacy.dto;

import lombok.Builder;
import lombok.Value;

/** TOTP secret for manual entry; otpAuthUri for QR in authenticator apps (Google/Microsoft Authenticator). */
@Value
@Builder
public class MfaSetupResponse {
    String secretBase32;
    String otpAuthUri;
    String issuer;
    String accountEmail;
}
