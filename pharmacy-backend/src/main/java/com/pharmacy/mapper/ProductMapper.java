package com.pharmacy.mapper;

import com.pharmacy.dto.ProductResponse;
import com.pharmacy.entity.Product;
import org.springframework.stereotype.Component;

@Component
public class ProductMapper {

    public ProductResponse toResponse(Product p) {
        if (p == null) {
            return null;
        }
        Long supplierId = p.getSupplier() != null ? p.getSupplier().getId() : null;
        String supplierName = p.getSupplier() != null ? p.getSupplier().getName() : null;
        return ProductResponse.builder()
                .id(p.getId())
                .name(p.getName())
                .description(p.getDescription())
                .category(p.getCategory())
                .barcode(p.getBarcode())
                .price(p.getPrice())
                .supplierId(supplierId)
                .supplierName(supplierName)
                .createdAt(p.getCreatedAt())
                .build();
    }
}
