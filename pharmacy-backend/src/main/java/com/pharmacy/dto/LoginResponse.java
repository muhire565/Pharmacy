package com.pharmacy.dto;

import com.pharmacy.entity.Role;
import lombok.Builder;
import lombok.Value;
import org.springframework.lang.Nullable;

@Value
@Builder
public class LoginResponse {
    @Nullable
    String token;

    @Builder.Default
    String tokenType = "Bearer";

    long expiresInMs;

    @Nullable
    String email;

    @Nullable
    Role role;

    @Nullable
    Long pharmacyId;

    @Nullable
    String pharmacyName;

    @Nullable
    String logoUrl;

    @Nullable
    String currencyCode;

    /** When true, use mfaChallengeToken with POST /auth/mfa/verify */
    @Builder.Default
    boolean mfaRequired = false;

    @Nullable
    String mfaChallengeToken;
}
