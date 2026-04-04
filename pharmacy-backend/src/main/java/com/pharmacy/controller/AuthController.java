package com.pharmacy.controller;

import com.pharmacy.dto.*;
import com.pharmacy.security.PharmacyUserDetails;
import com.pharmacy.security.SecurityUtils;
import com.pharmacy.service.AccountSecurityService;
import com.pharmacy.service.AuthService;
import com.pharmacy.service.MfaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("${app.api.prefix}/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final AccountSecurityService accountSecurityService;
    private final MfaService mfaService;

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/mfa/verify")
    public LoginResponse verifyMfa(@Valid @RequestBody MfaVerifyRequest request) {
        return authService.verifyMfa(request);
    }

    @PostMapping("/verify-email")
    public ResponseEntity<Map<String, Boolean>> verifyEmail(@Valid @RequestBody VerifyEmailRequest request) {
        accountSecurityService.verifyEmail(request.getToken());
        return ResponseEntity.ok(Map.of("verified", true));
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<Map<String, Boolean>> resendVerification(@Valid @RequestBody ResendVerificationRequest request) {
        accountSecurityService.resendVerification(request.getEmail());
        return ResponseEntity.ok(Map.of("ok", true));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, Boolean>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        accountSecurityService.requestPasswordReset(request.getEmail());
        return ResponseEntity.ok(Map.of("ok", true));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, Boolean>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        accountSecurityService.resetPassword(request.getToken(), request.getNewPassword());
        return ResponseEntity.ok(Map.of("ok", true));
    }

    @GetMapping("/mfa/setup")
    @PreAuthorize("hasAnyRole('PHARMACY_ADMIN','SYSTEM_OWNER')")
    public MfaSetupResponse mfaSetup() {
        PharmacyUserDetails p = SecurityUtils.requirePharmacyUser();
        return mfaService.setup(p.getUserId());
    }

    @PostMapping("/mfa/enable")
    @PreAuthorize("hasAnyRole('PHARMACY_ADMIN','SYSTEM_OWNER')")
    public ResponseEntity<Map<String, Boolean>> mfaEnable(@Valid @RequestBody MfaEnableRequest request) {
        PharmacyUserDetails p = SecurityUtils.requirePharmacyUser();
        mfaService.enable(p.getUserId(), request.getCode());
        return ResponseEntity.ok(Map.of("enabled", true));
    }

    @PostMapping("/mfa/disable")
    @PreAuthorize("hasAnyRole('PHARMACY_ADMIN','SYSTEM_OWNER')")
    public ResponseEntity<Map<String, Boolean>> mfaDisable(@Valid @RequestBody MfaDisableRequest request) {
        PharmacyUserDetails p = SecurityUtils.requirePharmacyUser();
        mfaService.disable(p.getUserId(), request.getPassword());
        return ResponseEntity.ok(Map.of("disabled", true));
    }
}
