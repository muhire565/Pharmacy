package com.pharmacy.service;

import com.pharmacy.config.InventoryProperties;
import com.pharmacy.dto.ExpiringBatchResponse;
import com.pharmacy.dto.LowStockProductResponse;
import com.pharmacy.dto.SaleResponse;
import com.pharmacy.dto.SalesSummaryResponse;
import com.pharmacy.entity.Batch;
import com.pharmacy.repository.BatchRepository;
import com.pharmacy.repository.SaleRepository;
import com.pharmacy.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final SaleRepository saleRepository;
    private final BatchRepository batchRepository;
    private final InventoryProperties inventoryProperties;

    private Long pid() {
        return SecurityUtils.currentPharmacyId();
    }

    @Transactional(readOnly = true)
    public SalesSummaryResponse dailySales(LocalDate day, ZoneId zone) {
        ZoneId z = zone != null ? zone : ZoneId.systemDefault();
        Instant from = day.atStartOfDay(z).toInstant();
        Instant to = day.plusDays(1).atStartOfDay(z).toInstant();
        return buildSummary(from, to);
    }

    @Transactional(readOnly = true)
    public SalesSummaryResponse monthlySales(int year, int month, ZoneId zone) {
        ZoneId z = zone != null ? zone : ZoneId.systemDefault();
        LocalDate first = LocalDate.of(year, month, 1);
        Instant from = first.atStartOfDay(z).toInstant();
        Instant to = first.plusMonths(1).atStartOfDay(z).toInstant();
        return buildSummary(from, to);
    }

    private SalesSummaryResponse buildSummary(Instant from, Instant to) {
        BigDecimal sum = saleRepository.sumTotalBetween(pid(), from, to);
        List<SaleResponse> sales = saleRepository.findByPharmacyAndCreatedAtBetween(pid(), from, to).stream()
                .map(this::toSaleResponse)
                .collect(Collectors.toList());
        return SalesSummaryResponse.builder()
                .from(from)
                .to(to)
                .totalAmount(sum != null ? sum : BigDecimal.ZERO)
                .saleCount(sales.size())
                .sales(sales)
                .build();
    }

    private SaleResponse toSaleResponse(com.pharmacy.entity.Sale s) {
        return SaleResponse.builder()
                .id(s.getId())
                .totalAmount(s.getTotalAmount())
                .createdAt(s.getCreatedAt())
                .cashierUsername(s.getUser().getUsername())
                .items(List.of())
                .build();
    }

    @Transactional(readOnly = true)
    public List<LowStockProductResponse> lowStock(int threshold) {
        return batchRepository.findLowStockProductRows(pid(), threshold).stream()
                .map(row -> LowStockProductResponse.builder()
                        .productId(((Number) row[0]).longValue())
                        .name((String) row[1])
                        .barcode((String) row[2])
                        .totalQuantity(((Number) row[3]).longValue())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ExpiringBatchResponse> expiringSoon() {
        LocalDate today = LocalDate.now();
        LocalDate until = today.plusDays(inventoryProperties.getExpiryWarningDays());
        List<Batch> batches = batchRepository.findBatchesExpiringBetween(pid(), today, until);
        return batches.stream()
                .map(b -> ExpiringBatchResponse.builder()
                        .batchId(b.getId())
                        .productId(b.getProduct().getId())
                        .productName(b.getProduct().getName())
                        .batchNumber(b.getBatchNumber())
                        .expiryDate(b.getExpiryDate())
                        .quantity(b.getQuantity())
                        .daysUntilExpiry(ChronoUnit.DAYS.between(today, b.getExpiryDate()))
                        .build())
                .collect(Collectors.toList());
    }
}
