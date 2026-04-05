package com.pharmacy.controller;

import com.pharmacy.dto.ExpenseRequest;
import com.pharmacy.dto.ExpenseResponse;
import com.pharmacy.service.CurrentUserService;
import com.pharmacy.service.ExpenseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

@RestController
@RequestMapping("${app.api.prefix}/expenses")
@RequiredArgsConstructor
public class ExpenseController {

    private final ExpenseService expenseService;
    private final CurrentUserService currentUserService;

    @PostMapping
    @PreAuthorize("hasRole('PHARMACY_ADMIN')")
    public ResponseEntity<ExpenseResponse> create(
            @Valid @RequestBody ExpenseRequest body,
            @RequestParam(required = false) ZoneId zone) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(expenseService.create(body, currentUserService.requireCurrentUser(), zone));
    }

    @GetMapping
    @PreAuthorize("hasRole('PHARMACY_ADMIN')")
    public List<ExpenseResponse> list(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) ZoneId zone) {
        return expenseService.list(from, to, zone);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('PHARMACY_ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        expenseService.delete(id);
    }
}
