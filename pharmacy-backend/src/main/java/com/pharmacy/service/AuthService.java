package com.pharmacy.service;

import com.pharmacy.config.ApiProperties;
import com.pharmacy.config.JwtProperties;
import com.pharmacy.dto.LoginRequest;
import com.pharmacy.dto.LoginResponse;
import com.pharmacy.entity.Role;
import com.pharmacy.exception.BusinessRuleException;
import com.pharmacy.repository.UserRepository;
import com.pharmacy.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
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

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, request.getPassword()));
        var user = userRepository.findWithPharmacyByEmailIgnoreCase(auth.getName())
                .orElseThrow();

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

        var ph = user.getPharmacy();
        String token = jwtTokenProvider.createToken(user.getId(), user.getEmail(), ph.getId(), user.getRole());
        String logoUrl = (user.getRole() != Role.SYSTEM_OWNER && ph.getLogoPath() != null)
                ? apiProperties.getPrefix() + "/pharmacies/me/logo"
                : null;
        return LoginResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .expiresInMs(jwtProperties.getExpirationMs())
                .email(user.getEmail())
                .role(user.getRole())
                .pharmacyId(user.getRole() == Role.SYSTEM_OWNER ? null : ph.getId())
                .pharmacyName(user.getRole() == Role.SYSTEM_OWNER ? "System Owner" : ph.getName())
                .logoUrl(logoUrl)
                .build();
    }
}
