package com.pharmacy.controller;

import com.pharmacy.dto.PosDraftCartResponse;
import com.pharmacy.dto.PosDraftSyncRequest;
import com.pharmacy.security.SecurityUtils;
import com.pharmacy.service.PosDraftService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("${app.api.prefix}/pos/draft")
@RequiredArgsConstructor
public class PosDraftController {

    private final PosDraftService posDraftService;

    @GetMapping
    @PreAuthorize("hasAnyRole('PHARMACY_ADMIN','CASHIER')")
    public PosDraftCartResponse get() {
        return posDraftService.get(SecurityUtils.currentPharmacyId());
    }

    @PutMapping
    @PreAuthorize("hasAnyRole('PHARMACY_ADMIN','CASHIER')")
    public PosDraftCartResponse sync(@Valid @RequestBody PosDraftSyncRequest request) {
        return posDraftService.sync(SecurityUtils.currentPharmacyId(), request.items());
    }
}
