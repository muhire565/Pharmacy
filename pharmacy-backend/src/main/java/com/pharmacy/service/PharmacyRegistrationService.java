package com.pharmacy.service;

import com.pharmacy.config.ApiProperties;
import com.pharmacy.dto.PharmacyResponse;
import com.pharmacy.entity.Pharmacy;
import com.pharmacy.entity.Role;
import com.pharmacy.entity.User;
import com.pharmacy.exception.BusinessRuleException;
import com.pharmacy.repository.PharmacyRepository;
import com.pharmacy.repository.UserRepository;
import com.pharmacy.util.PharmacyCurrency;
import com.pharmacy.util.SecureTokens;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.OffsetDateTime;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class PharmacyRegistrationService {

    private static final Pattern PHARMACY_NAME = Pattern.compile("^[a-zA-Z0-9\\s]{1,100}$");
    private static final Pattern PASSWORD_COMPLEXITY = Pattern.compile("^(?=.*[A-Za-z])(?=.*\\d).{8,}$");

    private final PharmacyRepository pharmacyRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final PhoneValidationService phoneValidationService;
    private final FileStorageService fileStorageService;
    private final ApiProperties apiProperties;
    private final EmailDispatchService emailDispatchService;

    @Transactional
    public PharmacyResponse register(
            String pharmacyName,
            String countryCode,
            String phone,
            String email,
            String address,
            String adminPassword,
            String currencyCode,
            MultipartFile logo) {

        String name = pharmacyName == null ? "" : pharmacyName.trim();
        if (!PHARMACY_NAME.matcher(name).matches()) {
            throw new BusinessRuleException(
                    "Pharmacy name is required, max 100 characters, letters numbers and spaces only");
        }
        if (pharmacyRepository.existsByNameIgnoreCase(name)) {
            throw new BusinessRuleException("A pharmacy with this name already exists");
        }
        String em = email == null ? "" : email.trim().toLowerCase();
        if (pharmacyRepository.findByEmailIgnoreCase(em).isPresent() || userRepository.existsByEmailIgnoreCase(em)) {
            throw new BusinessRuleException("Email is already registered");
        }
        if (adminPassword == null || !PASSWORD_COMPLEXITY.matcher(adminPassword).matches()) {
            throw new BusinessRuleException("Password must be at least 8 characters and include letters and numbers");
        }
        String addr = address == null ? "" : address.trim();
        if (addr.isEmpty() || addr.length() > 250) {
            throw new BusinessRuleException("Address is required, max 250 characters");
        }
        String cc = countryCode == null ? "" : countryCode.trim().toUpperCase();
        if (cc.length() != 2) {
            throw new BusinessRuleException("Invalid country code");
        }
        String e164 = phoneValidationService.toE164(cc, phone);
        String cur = PharmacyCurrency.normalizeOrDefault(currencyCode);

        Pharmacy pharmacy = Pharmacy.builder()
                .name(name)
                .countryCode(cc)
                .phoneE164(e164)
                .email(em)
                .address(addr)
                .currencyCode(cur)
                .locked(false)
                .build();
        pharmacy = pharmacyRepository.save(pharmacy);

        String logoRel = fileStorageService.savePharmacyLogo(pharmacy.getId(), logo);
        pharmacy.setLogoPath(logoRel);
        pharmacy = pharmacyRepository.save(pharmacy);

        String verifyRaw = SecureTokens.randomUrlToken();
        User admin = User.builder()
                .pharmacy(pharmacy)
                .email(em)
                .username(em)
                .password(passwordEncoder.encode(adminPassword))
                .role(Role.PHARMACY_ADMIN)
                .emailVerified(false)
                .emailVerificationTokenHash(SecureTokens.sha256Hex(verifyRaw))
                .emailVerificationExpiresAt(OffsetDateTime.now().plusHours(48))
                .mfaEnabled(false)
                .build();
        userRepository.save(admin);

        emailDispatchService.sendEmailVerification(em, verifyRaw);

        return toRegistrationResponse(pharmacy);
    }

    private PharmacyResponse toRegistrationResponse(Pharmacy p) {
        return PharmacyResponse.builder()
                .id(p.getId())
                .name(p.getName())
                .countryCode(p.getCountryCode())
                .phoneE164(p.getPhoneE164())
                .email(p.getEmail())
                .address(p.getAddress())
                .currencyCode(p.getCurrencyCode())
                .logoUrl(p.getLogoPath() != null
                        ? apiProperties.getPrefix() + "/public/pharmacies/" + p.getId() + "/logo"
                        : null)
                .emailVerificationPending(true)
                .build();
    }
}
