package com.pharmacy.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "jwt")
public class JwtProperties {

    private String secret = "change-me";
    private long expirationMs = 86_400_000L;
    /** Short-lived JWT after password OK, exchanged for access token with TOTP */
    private long mfaChallengeExpirationMs = 300_000L;
}
