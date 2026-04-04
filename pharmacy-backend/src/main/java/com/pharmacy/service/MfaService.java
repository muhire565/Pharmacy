package com.pharmacy.service;

import com.pharmacy.dto.MfaSetupResponse;
import com.pharmacy.entity.Role;
import com.pharmacy.entity.User;
import com.pharmacy.exception.BusinessRuleException;
import com.pharmacy.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class MfaService {

    private static final String ISSUER = "NexPharm";

    private final UserRepository userRepository;
    private final TotpService totpService;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public MfaSetupResponse setup(Long userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new BusinessRuleException("User not found"));
        if (user.getRole() != Role.PHARMACY_ADMIN && user.getRole() != Role.SYSTEM_OWNER) {
            throw new BusinessRuleException("Authenticator apps are only for pharmacy admins and system owners");
        }
        if (user.isMfaEnabled()) {
            throw new BusinessRuleException("Turn off MFA first if you want to register a new authenticator app");
        }
        String secret = totpService.generateSecret();
        user.setMfaSecret(secret);
        userRepository.save(user);
        String uri = totpService.otpAuthUri(ISSUER, user.getEmail(), secret);
        return MfaSetupResponse.builder()
                .secretBase32(secret)
                .otpAuthUri(uri)
                .issuer(ISSUER)
                .accountEmail(user.getEmail())
                .build();
    }

    @Transactional
    public void enable(Long userId, String code) {
        User user = userRepository.findById(userId).orElseThrow(() -> new BusinessRuleException("User not found"));
        if (user.getMfaSecret() == null || user.getMfaSecret().isBlank()) {
            throw new BusinessRuleException("Open Settings and start MFA setup first");
        }
        if (!totpService.verify(user.getMfaSecret(), code)) {
            throw new BusinessRuleException("Incorrect code from your authenticator app");
        }
        user.setMfaEnabled(true);
        userRepository.save(user);
    }

    @Transactional
    public void disable(Long userId, String password) {
        User user = userRepository.findById(userId).orElseThrow(() -> new BusinessRuleException("User not found"));
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new BusinessRuleException("Incorrect password");
        }
        user.setMfaEnabled(false);
        user.setMfaSecret(null);
        userRepository.save(user);
    }
}
