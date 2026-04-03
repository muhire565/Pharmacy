package com.pharmacy.service;

import com.pharmacy.dto.SupplierRequest;
import com.pharmacy.dto.SupplierResponse;
import com.pharmacy.entity.Pharmacy;
import com.pharmacy.entity.Supplier;
import com.pharmacy.exception.ResourceNotFoundException;
import com.pharmacy.mapper.SupplierMapper;
import com.pharmacy.repository.PharmacyRepository;
import com.pharmacy.repository.SupplierRepository;
import com.pharmacy.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SupplierService {

    private final SupplierRepository supplierRepository;
    private final PharmacyRepository pharmacyRepository;
    private final SupplierMapper supplierMapper;
    private final AuditService auditService;

    private Long pid() {
        return SecurityUtils.currentPharmacyId();
    }

    @Transactional(readOnly = true)
    public List<SupplierResponse> findAll() {
        return supplierRepository.findByPharmacyIdOrderByName(pid()).stream()
                .map(supplierMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SupplierResponse getById(Long id) {
        return supplierRepository.findByIdAndPharmacyId(id, pid())
                .map(supplierMapper::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found"));
    }

    @Transactional
    public SupplierResponse create(SupplierRequest request, String username) {
        Pharmacy pharmacy = pharmacyRepository.getReferenceById(pid());
        Supplier s = Supplier.builder()
                .pharmacy(pharmacy)
                .name(request.getName().trim())
                .contact(request.getContact())
                .phone(request.getPhone())
                .build();
        s = supplierRepository.save(s);
        auditService.record("SUPPLIER_CREATE", "Supplier", String.valueOf(s.getId()), username, s.getName());
        return supplierMapper.toResponse(s);
    }

    @Transactional
    public SupplierResponse update(Long id, SupplierRequest request, String username) {
        Supplier s = supplierRepository.findByIdAndPharmacyId(id, pid())
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found"));
        s.setName(request.getName().trim());
        s.setContact(request.getContact());
        s.setPhone(request.getPhone());
        s = supplierRepository.save(s);
        auditService.record("SUPPLIER_UPDATE", "Supplier", String.valueOf(s.getId()), username, s.getName());
        return supplierMapper.toResponse(s);
    }

    @Transactional
    public void delete(Long id, String username) {
        Supplier s = supplierRepository.findByIdAndPharmacyId(id, pid())
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found"));
        supplierRepository.delete(s);
        auditService.record("SUPPLIER_DELETE", "Supplier", String.valueOf(id), username, s.getName());
    }
}
