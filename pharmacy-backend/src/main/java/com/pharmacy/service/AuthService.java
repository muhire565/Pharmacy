package com.pharmacy.service;

import com.pharmacy.config.ApiProperties;
import com.pharmacy.config.JwtProperties;
import com.pharmacy.dto.LoginRequest;
import com.pharmacy.dto.LoginResponse;
import com.pharmacy.dto.MfaVerifyRequest;
import com.pharmacy.entity.Role;
import com.pharmacy.entity.User;
import com.pharmacy.exception.BusinessRuleException;
import com.pharmacy.repository.UserRepository;
import com.pharmacy.security.JwtTokenProvider;
import com.pharmacy.security.MfaChallenge;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final JwtProperties jwtProperties;
    private final UserRepository userRepository;
    private final ApiProperties apiProperties;
    private final TotpService totpService;

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        try {
            authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(email, request.getPassword()));
        } catch (DisabledException e) {
            throw new BusinessRuleException(
                    "Please verify your email before signing in. Check your inbox or use “Resend verification”.");
        }
        User user = userRepository.findWithPharmacyByEmailIgnoreCase(email).orElseThrow();

        if (user.getRole() != Role.SYSTEM_OWNER) {
            var ph = user.getPharmacy();
            if (ph != null && ph.isLocked()) {
                String msg = "Your pharmacy account has been locked by the admin. Contact support to unlock it.";
                if (ph.getLockedReason() != null && !ph.getLockedReason().isBlank()) {
                    msg = msg + " Reason: " + ph.getLockedReason().trim();
                }
                throw new BusinessRuleException(msg);
            }
        }

        if ((user.getRole() == Role.PHARMACY_ADMIN || user.getRole() == Role.SYSTEM_OWNER)
                && user.isMfaEnabled()) {
            return LoginResponse.builder()
                    .token(null)
                    .tokenType("Bearer")
                    .expiresInMs(0)
                    .email(user.getEmail())
                    .role(user.getRole())
                    .pharmacyId(null)
                    .pharmacyName(null)
                    .logoUrl(null)
                    .currencyCode(null)
                    .mfaRequired(true)
                    .mfaChallengeToken(jwtTokenProvider.createMfaChallengeToken(user.getId(), user.getEmail()))
                    .build();
        }

        return buildFullLoginResponse(user);
    }

    @Transactional(readOnly = true)
    public LoginResponse verifyMfa(MfaVerifyRequest request) {
        String challenge = request.getMfaChallengeToken();
        if (!jwtTokenProvider.validateMfaChallengeToken(challenge)) {
            throw new BusinessRuleException("Sign-in session expired. Please enter your email and password again.");
        }
        MfaChallenge parsed = jwtTokenProvider.parseMfaChallenge(challenge);
        User user = userRepository.findWithPharmacyByEmailIgnoreCase(parsed.email()).orElseThrow();
        if (!user.getId().equals(parsed.userId())) {
            throw new BusinessRuleException("Invalid sign-in session");
        }
        if (!user.isMfaEnabled() || user.getMfaSecret() == null) {
            throw new BusinessRuleException("Authenticator app is not enabled for this account");
        }
        if (!totpService.verify(user.getMfaSecret(), request.getCode())) {
            throw new BusinessRuleException("Incorrect code from your authenticator app");
        }

        if (user.getRole() != Role.SYSTEM_OWNER) {
            var ph = user.getPharmacy();
            if (ph != null && ph.isLocked()) {
                throw new BusinessRuleException("Your pharmacy account has been locked.");
            }
        }

        return buildFullLoginResponse(user);
    }

    private LoginResponse buildFullLoginResponse(User user) {
        var ph = user.getPharmacy();
        Long pharmacyIdForToken = ph != null ? ph.getId() : null;
        String token = jwtTokenProvider.createToken(user.getId(), user.getEmail(), pharmacyIdForToken, user.getRole());
        String logoUrl = (user.getRole() != Role.SYSTEM_OWNER && ph != null && ph.getLogoPath() != null)
                ? apiProperties.getPrefix() + "/pharmacies/me/logo"
                : null;
        String currencyCode = (ph != null) ? ph.getCurrencyCode() : null;
        return LoginResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .expiresInMs(jwtProperties.getExpirationMs())
                .email(user.getEmail())
                .role(user.getRole())
                .pharmacyId(user.getRole() == Role.SYSTEM_OWNER ? null : ph != null ? ph.getId() : null)
                .pharmacyName(user.getRole() == Role.SYSTEM_OWNER ? "System Owner" : ph != null ? ph.getName() : null)
                .logoUrl(logoUrl)
                .currencyCode(currencyCode)
                .mfaRequired(false)
                .mfaChallengeToken(null)
                .build();
    }
}
