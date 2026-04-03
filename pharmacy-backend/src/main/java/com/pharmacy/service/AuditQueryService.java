package com.pharmacy.service;

import com.pharmacy.dto.AuditLogResponse;
import com.pharmacy.repository.AuditLogRepository;
import com.pharmacy.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuditQueryService {

    private final AuditLogRepository auditLogRepository;

    @Transactional(readOnly = true)
    public Page<AuditLogResponse> page(Pageable pageable) {
        return auditLogRepository.findByPharmacyIdOrderByCreatedAtDesc(SecurityUtils.currentPharmacyId(), pageable)
                .map(log -> AuditLogResponse.builder()
                        .id(log.getId())
                        .action(log.getAction())
                        .entityType(log.getEntityType())
                        .entityId(log.getEntityId())
                        .username(log.getUsername())
                        .details(log.getDetails())
                        .createdAt(log.getCreatedAt())
                        .build());
    }
}
