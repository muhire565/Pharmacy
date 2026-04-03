package com.pharmacy.controller;

import com.pharmacy.dto.ProductInventorySummaryResponse;
import com.pharmacy.service.InventoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("${app.api.prefix}/inventory")
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryService inventoryService;

    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('PHARMACY_ADMIN','CASHIER')")
    public List<ProductInventorySummaryResponse> summary() {
        return inventoryService.summarizeByProduct();
    }
}
