package com.pharmacy.controller;

import com.pharmacy.dto.ProductRequest;
import com.pharmacy.dto.ProductResponse;
import com.pharmacy.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("${app.api.prefix}/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping
    @PreAuthorize("hasAnyRole('PHARMACY_ADMIN','CASHIER')")
    public List<ProductResponse> list(@RequestParam(required = false) String q) {
        if (q != null && !q.isBlank()) {
            return productService.search(q);
        }
        return productService.findAll();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('PHARMACY_ADMIN','CASHIER')")
    public ProductResponse get(@PathVariable Long id) {
        return productService.getById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('PHARMACY_ADMIN')")
    public ProductResponse create(@Valid @RequestBody ProductRequest request,
                                  @AuthenticationPrincipal UserDetails user) {
        return productService.create(request, user.getUsername());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('PHARMACY_ADMIN')")
    public ProductResponse update(@PathVariable Long id,
                                  @Valid @RequestBody ProductRequest request,
                                  @AuthenticationPrincipal UserDetails user) {
        return productService.update(id, request, user.getUsername());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('PHARMACY_ADMIN')")
    public void delete(@PathVariable Long id, @AuthenticationPrincipal UserDetails user) {
        productService.delete(id, user.getUsername());
    }

    @GetMapping("/barcode/suggest")
    @PreAuthorize("hasRole('PHARMACY_ADMIN')")
    public SuggestBarcodeResponse suggestBarcode() {
        return new SuggestBarcodeResponse(productService.suggestUniqueBarcode());
    }

    @PostMapping("/{id}/regenerate-barcode")
    @PreAuthorize("hasRole('PHARMACY_ADMIN')")
    public ProductResponse regenerateBarcode(@PathVariable Long id,
                                             @AuthenticationPrincipal UserDetails user) {
        return productService.regenerateBarcode(id, user.getUsername());
    }

    public record SuggestBarcodeResponse(String barcode) {
    }
}
