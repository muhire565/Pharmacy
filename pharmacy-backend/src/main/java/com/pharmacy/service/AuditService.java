package com.pharmacy.service;

import com.pharmacy.entity.AuditLog;
import com.pharmacy.entity.Pharmacy;
import com.pharmacy.repository.AuditLogRepository;
import com.pharmacy.repository.PharmacyRepository;
import com.pharmacy.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository auditLogRepository;
    private final PharmacyRepository pharmacyRepository;

    @Transactional
    public void record(String action, String entityType, String entityId, String username, String details) {
        try {
            Long pid = SecurityUtils.currentPharmacyId();
            Pharmacy pharmacy = pharmacyRepository.getReferenceById(pid);
            auditLogRepository.save(AuditLog.builder()
                    .pharmacy(pharmacy)
                    .action(action)
                    .entityType(entityType)
                    .entityId(entityId)
                    .username(username)
                    .details(details)
                    .build());
        } catch (Exception e) {
            log.warn("Audit log failed: {}", e.getMessage());
        }
    }
}
