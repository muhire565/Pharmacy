package com.pharmacy.controller;

import com.pharmacy.dto.SaleRequest;
import com.pharmacy.dto.SaleResponse;
import com.pharmacy.service.CurrentUserService;
import com.pharmacy.service.SaleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("${app.api.prefix}/sales")
@RequiredArgsConstructor
public class SaleController {

    private final SaleService saleService;
    private final CurrentUserService currentUserService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('PHARMACY_ADMIN','CASHIER')")
    public SaleResponse create(@Valid @RequestBody SaleRequest request) {
        return saleService.createSale(request, currentUserService.requireCurrentUser());
    }
}
