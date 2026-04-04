package com.pharmacy.service;

import com.pharmacy.entity.Role;
import com.pharmacy.entity.User;
import com.pharmacy.exception.BusinessRuleException;
import com.pharmacy.repository.UserRepository;
import com.pharmacy.util.SecureTokens;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class AccountSecurityService {

    private static final Pattern PASSWORD_COMPLEXITY = Pattern.compile("^(?=.*[A-Za-z])(?=.*\\d).{8,}$");

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailDispatchService emailDispatchService;

    @Transactional
    public void verifyEmail(String rawToken) {
        String hash = SecureTokens.sha256Hex(rawToken.trim());
        User u = userRepository
                .findByEmailVerificationTokenHash(hash)
                .orElseThrow(() -> new BusinessRuleException("Invalid or expired verification link"));
        if (u.getEmailVerificationExpiresAt() == null
                || u.getEmailVerificationExpiresAt().isBefore(OffsetDateTime.now())) {
            throw new BusinessRuleException(
                    "Verification link has expired. Use “Resend verification” on the sign-in page.");
        }
        u.setEmailVerified(true);
        u.setEmailVerificationTokenHash(null);
        u.setEmailVerificationExpiresAt(null);
        userRepository.save(u);
    }

    /** Does not reveal whether the email exists (same response for all). */
    @Transactional
    public void resendVerification(String email) {
        String em = email == null ? "" : email.trim().toLowerCase();
        if (em.isEmpty()) {
            return;
        }
        userRepository.findByEmailIgnoreCase(em).ifPresent(u -> {
            if (u.isEmailVerified() || u.getRole() == Role.SYSTEM_OWNER) {
                return;
            }
            String raw = SecureTokens.randomUrlToken();
            u.setEmailVerificationTokenHash(SecureTokens.sha256Hex(raw));
            u.setEmailVerificationExpiresAt(OffsetDateTime.now().plusHours(48));
            userRepository.save(u);
            emailDispatchService.sendEmailVerification(u.getEmail(), raw);
        });
    }

    @Transactional
    public void requestPasswordReset(String email) {
        String em = email == null ? "" : email.trim().toLowerCase();
        if (em.isEmpty()) {
            return;
        }
        userRepository.findByEmailIgnoreCase(em).ifPresent(u -> {
            if (u.getRole() == Role.SYSTEM_OWNER) {
                return;
            }
            String raw = SecureTokens.randomUrlToken();
            u.setPasswordResetTokenHash(SecureTokens.sha256Hex(raw));
            u.setPasswordResetExpiresAt(OffsetDateTime.now().plusHours(1));
            userRepository.save(u);
            emailDispatchService.sendPasswordReset(u.getEmail(), raw);
        });
    }

    @Transactional
    public void resetPassword(String rawToken, String newPassword) {
        validatePasswordStrength(newPassword);
        String hash = SecureTokens.sha256Hex(rawToken.trim());
        User u = userRepository
                .findByPasswordResetTokenHash(hash)
                .orElseThrow(() -> new BusinessRuleException("Invalid or expired reset link"));
        if (u.getPasswordResetExpiresAt() == null
                || u.getPasswordResetExpiresAt().isBefore(OffsetDateTime.now())) {
            throw new BusinessRuleException("Reset link has expired. Request a new password reset.");
        }
        u.setPassword(passwordEncoder.encode(newPassword));
        u.setPasswordResetTokenHash(null);
        u.setPasswordResetExpiresAt(null);
        userRepository.save(u);
    }

    private void validatePasswordStrength(String password) {
        if (password == null || !PASSWORD_COMPLEXITY.matcher(password).matches()) {
            throw new BusinessRuleException("Password must be at least 8 characters and include letters and numbers");
        }
    }
}
