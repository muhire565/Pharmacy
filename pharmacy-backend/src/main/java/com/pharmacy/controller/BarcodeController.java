package com.pharmacy.controller;

import com.pharmacy.dto.BarcodeLookupResponse;
import com.pharmacy.service.BarcodeService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("${app.api.prefix}/barcodes")
@RequiredArgsConstructor
public class BarcodeController {

    private final BarcodeService barcodeService;

    @GetMapping("/lookup")
    @PreAuthorize("hasAnyRole('PHARMACY_ADMIN','CASHIER')")
    public BarcodeLookupResponse lookup(@RequestParam String code) {
        return barcodeService.lookup(code);
    }

    @GetMapping("/product/{productId}/images")
    @PreAuthorize("hasAnyRole('PHARMACY_ADMIN','CASHIER')")
    public Map<String, String> images(@PathVariable Long productId) throws Exception {
        return barcodeService.generateImagesForProduct(productId);
    }
}
