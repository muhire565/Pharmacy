package com.pharmacy.service;

import com.pharmacy.config.ApiProperties;
import com.pharmacy.dto.OwnerLockRequest;
import com.pharmacy.dto.OwnerPharmacyResponse;
import com.pharmacy.dto.OwnerPharmacyUpdateRequest;
import com.pharmacy.entity.Pharmacy;
import com.pharmacy.exception.BusinessRuleException;
import com.pharmacy.exception.ResourceNotFoundException;
import com.pharmacy.repository.PharmacyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class OwnerPharmacyService {

    private final PharmacyRepository pharmacyRepository;
    private final ApiProperties apiProperties;
    private final LiveUpdatesService liveUpdatesService;

    @Transactional(readOnly = true)
    public Page<OwnerPharmacyResponse> list(Pageable pageable) {
        return pharmacyRepository.findAll(pageable).map(this::toOwnerResponse);
    }

    @Transactional(readOnly = true)
    public OwnerPharmacyResponse get(Long id) {
        Pharmacy p = pharmacyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pharmacy not found"));
        return toOwnerResponse(p);
    }

    @Transactional
    public OwnerPharmacyResponse update(Long id, OwnerPharmacyUpdateRequest req) {
        Pharmacy p = pharmacyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pharmacy not found"));

        String name = req.getName().trim();
        if (pharmacyRepository.existsByNameIgnoreCaseAndIdNot(name, id)) {
            throw new BusinessRuleException("A pharmacy with this name already exists");
        }
        String em = req.getEmail().trim().toLowerCase();
        if (pharmacyRepository.findByEmailIgnoreCase(em).filter(o -> !o.getId().equals(id)).isPresent()) {
            throw new BusinessRuleException("Email is already in use");
        }

        p.setName(name);
        p.setCountryCode(req.getCountryCode().trim().toUpperCase());
        p.setPhoneE164(req.getPhoneE164().trim());
        p.setEmail(em);
        p.setAddress(req.getAddress().trim());
        p = pharmacyRepository.save(p);
        liveUpdatesService.pharmacyUpdated(p.getId());
        return toOwnerResponse(p);
    }

    @Transactional
    public void delete(Long id) {
        Pharmacy p = pharmacyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pharmacy not found"));
        pharmacyRepository.delete(p);
        liveUpdatesService.pharmacyUpdated(id);
    }

    @Transactional
    public OwnerPharmacyResponse lock(Long id, OwnerLockRequest req) {
        Pharmacy p = pharmacyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pharmacy not found"));
        p.setLocked(true);
        p.setLockedAt(Instant.now());
        String reason = req != null ? req.reason() : null;
        p.setLockedReason(reason == null ? null : reason.trim());
        p = pharmacyRepository.save(p);
        liveUpdatesService.pharmacyLockChanged(p.getId(), true, p.getLockedReason());
        return toOwnerResponse(p);
    }

    @Transactional
    public OwnerPharmacyResponse unlock(Long id) {
        Pharmacy p = pharmacyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pharmacy not found"));
        p.setLocked(false);
        p.setLockedAt(null);
        p.setLockedReason(null);
        p = pharmacyRepository.save(p);
        liveUpdatesService.pharmacyLockChanged(p.getId(), false, null);
        return toOwnerResponse(p);
    }

    private OwnerPharmacyResponse toOwnerResponse(Pharmacy p) {
        String logoUrl = p.getLogoPath() != null
                ? apiProperties.getPrefix() + "/public/pharmacies/" + p.getId() + "/logo"
                : null;
        return OwnerPharmacyResponse.builder()
                .id(p.getId())
                .name(p.getName())
                .countryCode(p.getCountryCode())
                .phoneE164(p.getPhoneE164())
                .email(p.getEmail())
                .address(p.getAddress())
                .locked(p.isLocked())
                .lockedReason(p.getLockedReason())
                .lockedAt(p.getLockedAt())
                .createdAt(p.getCreatedAt())
                .logoUrl(logoUrl)
                .build();
    }
}

