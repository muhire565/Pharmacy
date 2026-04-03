package com.pharmacy.controller;

import com.pharmacy.dto.StockMovementResponse;
import com.pharmacy.service.StockMovementQueryService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("${app.api.prefix}/stock-movements")
@RequiredArgsConstructor
public class StockMovementController {

    private final StockMovementQueryService stockMovementQueryService;

    @GetMapping("/product/{productId}")
    @PreAuthorize("hasRole('PHARMACY_ADMIN')")
    public List<StockMovementResponse> byProduct(@PathVariable Long productId) {
        return stockMovementQueryService.byProduct(productId);
    }
}
