package com.pharmacy.service;

import com.pharmacy.dto.ProductInventorySummaryResponse;
import com.pharmacy.repository.ProductRepository;
import com.pharmacy.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.sql.Date;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InventoryService {

    private final ProductRepository productRepository;

    private Long pid() {
        return SecurityUtils.currentPharmacyId();
    }

    @Transactional(readOnly = true)
    public List<ProductInventorySummaryResponse> summarizeByProduct() {
        return productRepository.findInventorySummaryRows(pid()).stream()
                .map(this::mapRow)
                .collect(Collectors.toList());
    }

    private ProductInventorySummaryResponse mapRow(Object[] row) {
        return ProductInventorySummaryResponse.builder()
                .productId(((Number) row[0]).longValue())
                .name((String) row[1])
                .barcode((String) row[2])
                .category(row[3] != null ? (String) row[3] : null)
                .price(row[4] != null ? (BigDecimal) row[4] : BigDecimal.ZERO)
                .supplierName(row[5] != null ? (String) row[5] : null)
                .totalQuantity(row[6] != null ? ((Number) row[6]).intValue() : 0)
                .batchCount(row[7] != null ? ((Number) row[7]).intValue() : 0)
                .nearestExpiry(parseNearest(row[8]))
                .build();
    }

    private static LocalDate parseNearest(Object v) {
        if (v == null) return null;
        if (v instanceof LocalDate ld) return ld;
        if (v instanceof Date sql) return sql.toLocalDate();
        return null;
    }
}
