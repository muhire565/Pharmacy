package com.pharmacy.controller;

import com.pharmacy.dto.SupplierRequest;
import com.pharmacy.dto.SupplierResponse;
import com.pharmacy.service.SupplierService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("${app.api.prefix}/suppliers")
@RequiredArgsConstructor
public class SupplierController {

    private final SupplierService supplierService;

    @GetMapping
    @PreAuthorize("hasRole('PHARMACY_ADMIN')")
    public List<SupplierResponse> list() {
        return supplierService.findAll();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('PHARMACY_ADMIN')")
    public SupplierResponse get(@PathVariable Long id) {
        return supplierService.getById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('PHARMACY_ADMIN')")
    public SupplierResponse create(@Valid @RequestBody SupplierRequest request,
                                   @AuthenticationPrincipal UserDetails user) {
        return supplierService.create(request, user.getUsername());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('PHARMACY_ADMIN')")
    public SupplierResponse update(@PathVariable Long id,
                                   @Valid @RequestBody SupplierRequest request,
                                   @AuthenticationPrincipal UserDetails user) {
        return supplierService.update(id, request, user.getUsername());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('PHARMACY_ADMIN')")
    public void delete(@PathVariable Long id, @AuthenticationPrincipal UserDetails user) {
        supplierService.delete(id, user.getUsername());
    }
}
