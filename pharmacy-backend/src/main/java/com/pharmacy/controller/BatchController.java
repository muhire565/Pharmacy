package com.pharmacy.controller;

import com.pharmacy.dto.BatchRequest;
import com.pharmacy.dto.BatchResponse;
import com.pharmacy.service.BatchService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("${app.api.prefix}")
@RequiredArgsConstructor
public class BatchController {

    private final BatchService batchService;

    @GetMapping("/products/{productId}/batches")
    @PreAuthorize("hasAnyRole('PHARMACY_ADMIN','CASHIER')")
    public List<BatchResponse> listByProduct(@PathVariable Long productId) {
        return batchService.listByProduct(productId);
    }

    @GetMapping("/products/{productId}/batches/available")
    @PreAuthorize("hasAnyRole('PHARMACY_ADMIN','CASHIER')")
    public List<BatchResponse> available(@PathVariable Long productId) {
        return batchService.availableForProduct(productId);
    }

    @PostMapping("/batches")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('PHARMACY_ADMIN')")
    public BatchResponse create(@Valid @RequestBody BatchRequest request,
                                @AuthenticationPrincipal UserDetails user) {
        return batchService.create(request, user.getUsername());
    }
}
