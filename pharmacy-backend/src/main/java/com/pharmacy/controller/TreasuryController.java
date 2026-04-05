package com.pharmacy.controller;

import com.pharmacy.dto.TreasuryMovementRequest;
import com.pharmacy.dto.TreasuryMovementResponse;
import com.pharmacy.dto.TreasurySummaryResponse;
import com.pharmacy.service.CurrentUserService;
import com.pharmacy.service.TreasuryService;
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
@RequestMapping("${app.api.prefix}/treasury")
@RequiredArgsConstructor
public class TreasuryController {

    private final TreasuryService treasuryService;
    private final CurrentUserService currentUserService;

    @GetMapping("/summary")
    @PreAuthorize("hasRole('PHARMACY_ADMIN')")
    public TreasurySummaryResponse summary(@RequestParam(required = false) ZoneId zone) {
        return treasuryService.summary(zone);
    }

    @GetMapping("/movements")
    @PreAuthorize("hasRole('PHARMACY_ADMIN')")
    public List<TreasuryMovementResponse> movements(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) ZoneId zone) {
        return treasuryService.list(from, to, zone);
    }

    @PostMapping("/movements")
    @PreAuthorize("hasRole('PHARMACY_ADMIN')")
    public ResponseEntity<TreasuryMovementResponse> create(@Valid @RequestBody TreasuryMovementRequest body) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(treasuryService.create(body, currentUserService.requireCurrentUser()));
    }
}
