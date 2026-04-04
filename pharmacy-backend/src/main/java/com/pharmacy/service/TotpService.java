package com.pharmacy.service;

import dev.samstevens.totp.code.DefaultCodeGenerator;
import dev.samstevens.totp.code.DefaultCodeVerifier;
import dev.samstevens.totp.code.HashingAlgorithm;
import dev.samstevens.totp.secret.DefaultSecretGenerator;
import dev.samstevens.totp.time.SystemTimeProvider;
import org.springframework.stereotype.Service;

@Service
public class TotpService {

    private final DefaultCodeVerifier verifier;

    public TotpService() {
        verifier = new DefaultCodeVerifier(new DefaultCodeGenerator(HashingAlgorithm.SHA1), new SystemTimeProvider());
        verifier.setTimePeriod(30);
        verifier.setAllowedTimePeriodDiscrepancy(1);
    }

    public String generateSecret() {
        return new DefaultSecretGenerator().generate();
    }

    public boolean verify(String base32Secret, String sixDigitCode) {
        if (base32Secret == null || base32Secret.isBlank() || sixDigitCode == null || sixDigitCode.isBlank()) {
            return false;
        }
        String normalized = sixDigitCode.trim().replaceAll("\\s+", "");
        if (!normalized.matches("\\d{6}")) {
            return false;
        }
        return verifier.isValidCode(base32Secret, normalized);
    }

    public String otpAuthUri(String issuer, String accountEmail, String base32Secret) {
        return "otpauth://totp/"
                + urlEncode(issuer + ":" + accountEmail)
                + "?secret="
                + base32Secret
                + "&issuer="
                + urlEncode(issuer)
                + "&algorithm=SHA1&digits=6&period=30";
    }

    private static String urlEncode(String s) {
        return java.net.URLEncoder.encode(s, java.nio.charset.StandardCharsets.UTF_8).replace("+", "%20");
    }
}
