package com.pharmacy.service;

import com.pharmacy.config.ApiProperties;
import com.pharmacy.dto.PharmacyResponse;
import com.pharmacy.entity.Pharmacy;
import com.pharmacy.entity.Role;
import com.pharmacy.entity.User;
import com.pharmacy.exception.BusinessRuleException;
import com.pharmacy.exception.ResourceNotFoundException;
import com.pharmacy.repository.PharmacyRepository;
import com.pharmacy.repository.UserRepository;
import com.pharmacy.security.SecurityUtils;
import com.pharmacy.util.PharmacyCurrency;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class PharmacyProfileService {

    private static final Pattern PHARMACY_NAME = Pattern.compile("^[a-zA-Z0-9\\s]{1,100}$");

    private final PharmacyRepository pharmacyRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;
    private final PhoneValidationService phoneValidationService;
    private final ApiProperties apiProperties;

    @Transactional(readOnly = true)
    public PharmacyResponse getMine() {
        Pharmacy p = pharmacyRepository.findById(SecurityUtils.currentPharmacyId())
                .orElseThrow(() -> new ResourceNotFoundException("Pharmacy not found"));
        return toMeResponse(p);
    }

    @Transactional
    public PharmacyResponse updateMine(
            String pharmacyName,
            String countryCode,
            String phone,
            String email,
            String address,
            String currencyCode,
            MultipartFile logo) {

        if (SecurityUtils.requirePharmacyUser().getRole() != Role.PHARMACY_ADMIN) {
            throw new BusinessRuleException("Only pharmacy admin can update profile");
        }

        Pharmacy p = pharmacyRepository.findById(SecurityUtils.currentPharmacyId())
                .orElseThrow(() -> new ResourceNotFoundException("Pharmacy not found"));
        final Long pharmacyEntityId = p.getId();

        String name = pharmacyName == null ? "" : pharmacyName.trim();
        if (!PHARMACY_NAME.matcher(name).matches()) {
            throw new BusinessRuleException("Invalid pharmacy name");
        }
        if (pharmacyRepository.existsByNameIgnoreCaseAndIdNot(name, pharmacyEntityId)) {
            throw new BusinessRuleException("A pharmacy with this name already exists");
        }

        String em = email == null ? "" : email.trim().toLowerCase();
        if (em.isEmpty()) {
            throw new BusinessRuleException("Email is required");
        }
        if (!em.equalsIgnoreCase(p.getEmail())) {
            if (pharmacyRepository.findByEmailIgnoreCase(em).filter(o -> !o.getId().equals(pharmacyEntityId)).isPresent()) {
                throw new BusinessRuleException("Email is already in use");
            }
            userRepository.findByEmailIgnoreCase(em)
                    .filter(u -> !u.getId().equals(SecurityUtils.currentUserId()))
                    .ifPresent(u -> {
                        throw new BusinessRuleException("Email is already in use");
                    });
        }

        String addr = address == null ? "" : address.trim();
        if (addr.isEmpty() || addr.length() > 250) {
            throw new BusinessRuleException("Invalid address");
        }
        String cc = countryCode == null ? "" : countryCode.trim().toUpperCase();
        if (cc.length() != 2) {
            throw new BusinessRuleException("Invalid country code");
        }
        String e164 = phoneValidationService.toE164(cc, phone);

        String cur = PharmacyCurrency.normalizeForUpdate(currencyCode, p.getCurrencyCode());

        p.setName(name);
        p.setCountryCode(cc);
        p.setPhoneE164(e164);
        p.setEmail(em);
        p.setAddress(addr);
        p.setCurrencyCode(cur);

        if (logo != null && !logo.isEmpty()) {
            String logoRel = fileStorageService.savePharmacyLogo(p.getId(), logo);
            p.setLogoPath(logoRel);
        }

        p = pharmacyRepository.save(p);

        User admin = userRepository.findById(SecurityUtils.currentUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        admin.setEmail(em);
        admin.setUsername(em);
        userRepository.save(admin);

        return toMeResponse(p);
    }

    @Transactional(readOnly = true)
    public Resource loadLogoForPharmacy(Long pharmacyId) {
        Pharmacy p = pharmacyRepository.findById(pharmacyId)
                .orElseThrow(() -> new ResourceNotFoundException("Pharmacy not found"));
        if (p.getLogoPath() == null) {
            throw new ResourceNotFoundException("No logo");
        }
        Path path = fileStorageService.resolveLogoPath(p.getLogoPath());
        if (!Files.exists(path)) {
            throw new ResourceNotFoundException("Logo file missing");
        }
        try {
            return new UrlResource(path.toUri());
        } catch (MalformedURLException e) {
            throw new ResourceNotFoundException("Logo not readable");
        }
    }

    public PharmacyResponse toMeResponse(Pharmacy p) {
        boolean verificationPending = userRepository
                .findById(SecurityUtils.currentUserId())
                .map(u -> !u.isEmailVerified() && u.getRole() != Role.SYSTEM_OWNER)
                .orElse(false);
        return PharmacyResponse.builder()
                .id(p.getId())
                .name(p.getName())
                .countryCode(p.getCountryCode())
                .phoneE164(p.getPhoneE164())
                .email(p.getEmail())
                .address(p.getAddress())
                .currencyCode(p.getCurrencyCode())
                .logoUrl(p.getLogoPath() != null ? apiProperties.getPrefix() + "/pharmacies/me/logo" : null)
                .emailVerificationPending(verificationPending)
                .build();
    }
}
