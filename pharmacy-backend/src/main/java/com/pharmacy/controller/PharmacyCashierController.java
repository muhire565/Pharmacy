package com.pharmacy.controller;

import com.pharmacy.dto.CashierCreateRequest;
import com.pharmacy.dto.CashierResponse;
import com.pharmacy.service.CurrentUserService;
import com.pharmacy.service.PharmacyCashierService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("${app.api.prefix}/pharmacy/cashiers")
@RequiredArgsConstructor
public class PharmacyCashierController {

    private final PharmacyCashierService pharmacyCashierService;
    private final CurrentUserService currentUserService;

    @GetMapping
    @PreAuthorize("hasRole('PHARMACY_ADMIN')")
    public List<CashierResponse> list() {
        return pharmacyCashierService.listCashiers();
    }

    @PostMapping
    @PreAuthorize("hasRole('PHARMACY_ADMIN')")
    public ResponseEntity<CashierResponse> create(@Valid @RequestBody CashierCreateRequest body) {
        var actor = currentUserService.requireCurrentUser();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(pharmacyCashierService.createCashier(body, actor.getUsername()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('PHARMACY_ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        var actor = currentUserService.requireCurrentUser();
        pharmacyCashierService.deleteCashier(id, actor.getUsername());
    }
}
