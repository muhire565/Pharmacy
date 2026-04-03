package com.pharmacy.controller;

import com.pharmacy.dto.OwnerLockRequest;
import com.pharmacy.dto.OwnerPharmacyResponse;
import com.pharmacy.dto.OwnerPharmacyUpdateRequest;
import com.pharmacy.service.OwnerPharmacyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("${app.api.prefix}/owner")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SYSTEM_OWNER')")
public class OwnerController {

    private final OwnerPharmacyService ownerPharmacyService;

    @GetMapping("/pharmacies")
    public Page<OwnerPharmacyResponse> list(Pageable pageable) {
        return ownerPharmacyService.list(pageable);
    }

    @GetMapping("/pharmacies/{id}")
    public OwnerPharmacyResponse get(@PathVariable Long id) {
        return ownerPharmacyService.get(id);
    }

    @PutMapping("/pharmacies/{id}")
    public OwnerPharmacyResponse update(@PathVariable Long id, @Valid @RequestBody OwnerPharmacyUpdateRequest req) {
        return ownerPharmacyService.update(id, req);
    }

    @DeleteMapping("/pharmacies/{id}")
    public void delete(@PathVariable Long id) {
        ownerPharmacyService.delete(id);
    }

    @PostMapping("/pharmacies/{id}/lock")
    public OwnerPharmacyResponse lock(@PathVariable Long id, @Valid @RequestBody(required = false) OwnerLockRequest req) {
        return ownerPharmacyService.lock(id, req);
    }

    @PostMapping("/pharmacies/{id}/unlock")
    public OwnerPharmacyResponse unlock(@PathVariable Long id) {
        return ownerPharmacyService.unlock(id);
    }
}

