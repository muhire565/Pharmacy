package com.pharmacy.service;

import com.pharmacy.config.InventoryProperties;
import com.pharmacy.dto.ExpiringBatchResponse;
import com.pharmacy.dto.ExpenseResponse;
import com.pharmacy.dto.FinancialReportResponse;
import com.pharmacy.dto.InventoryAddedRowResponse;
import com.pharmacy.dto.LowStockProductResponse;
import com.pharmacy.dto.MedicineSoldRowResponse;
import com.pharmacy.dto.ReportPharmacyHeaderResponse;
import com.pharmacy.dto.SaleResponse;
import com.pharmacy.dto.SalesSummaryResponse;
import com.pharmacy.entity.Batch;
import com.pharmacy.entity.Expense;
import com.pharmacy.entity.Pharmacy;
import com.pharmacy.entity.StockMovementType;
import com.pharmacy.entity.StockReference;
import com.pharmacy.exception.BusinessRuleException;
import com.pharmacy.exception.ResourceNotFoundException;
import com.pharmacy.repository.BatchRepository;
import com.pharmacy.repository.ExpenseRepository;
import com.pharmacy.repository.PharmacyRepository;
import com.pharmacy.repository.SaleItemRepository;
import com.pharmacy.repository.SaleRepository;
import com.pharmacy.repository.StockMovementRepository;
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
    private final SaleItemRepository saleItemRepository;
    private final StockMovementRepository stockMovementRepository;
    private final ExpenseRepository expenseRepository;
    private final PharmacyRepository pharmacyRepository;
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

    @Transactional(readOnly = true)
    public FinancialReportResponse financialReport(
            LocalDate fromDate, LocalDate toDate, ZoneId zone, int lowStockThreshold) {
        if (fromDate.isAfter(toDate)) {
            throw new BusinessRuleException("Start date must be on or before end date");
        }
        long days = ChronoUnit.DAYS.between(fromDate, toDate) + 1;
        if (days > 1096) {
            throw new BusinessRuleException("Report range cannot exceed 1096 days");
        }
        ZoneId z = zone != null ? zone : ZoneId.systemDefault();
        Instant from = fromDate.atStartOfDay(z).toInstant();
        Instant to = toDate.plusDays(1).atStartOfDay(z).toInstant();

        Pharmacy p = pharmacyRepository.findById(pid())
                .orElseThrow(() -> new ResourceNotFoundException("Pharmacy not found"));
        ReportPharmacyHeaderResponse header = ReportPharmacyHeaderResponse.builder()
                .name(p.getName())
                .address(p.getAddress())
                .phoneE164(p.getPhoneE164())
                .email(p.getEmail())
                .currencyCode(p.getCurrencyCode())
                .build();

        SalesSummaryResponse salesBlock = buildSummary(from, to);
        BigDecimal totalExpenses = expenseRepository.sumAmountBetween(pid(), from, to);
        if (totalExpenses == null) {
            totalExpenses = BigDecimal.ZERO;
        }

        List<Expense> expenseEntities =
                expenseRepository.findByPharmacyAndIncurredBetween(pid(), from, to);

        List<MedicineSoldRowResponse> medicines = saleItemRepository
                .aggregateSoldByProduct(pid(), from, to).stream()
                .map(this::mapMedicineRow)
                .collect(Collectors.toList());

        Long unitsAdded = stockMovementRepository.sumRestockQuantityBetween(
                pid(), StockMovementType.IN, StockReference.RESTOCK, from, to);
        long invUnits = unitsAdded != null ? unitsAdded : 0L;

        List<InventoryAddedRowResponse> invRows = stockMovementRepository
                .aggregateRestockByProduct(pid(), StockMovementType.IN, StockReference.RESTOCK, from, to).stream()
                .map(this::mapInventoryRow)
                .collect(Collectors.toList());

        List<LowStockProductResponse> low = lowStock(lowStockThreshold);
        BigDecimal net = salesBlock.getTotalAmount().subtract(totalExpenses);

        return FinancialReportResponse.builder()
                .pharmacy(header)
                .periodFrom(from)
                .periodTo(to)
                .totalSales(salesBlock.getTotalAmount())
                .saleCount(salesBlock.getSaleCount())
                .totalExpenses(totalExpenses)
                .netAmount(net)
                .inventoryUnitsAdded(invUnits)
                .medicinesSold(medicines)
                .expenses(expenseEntities.stream().map(this::toExpenseResponse).collect(Collectors.toList()))
                .inventoryAdded(invRows)
                .lowStock(low)
                .sales(salesBlock.getSales())
                .build();
    }

    private MedicineSoldRowResponse mapMedicineRow(Object[] row) {
        return MedicineSoldRowResponse.builder()
                .productId(((Number) row[0]).longValue())
                .productName((String) row[1])
                .quantitySold(((Number) row[2]).longValue())
                .lineTotal(toBigDecimal(row[3]))
                .build();
    }

    private InventoryAddedRowResponse mapInventoryRow(Object[] row) {
        return InventoryAddedRowResponse.builder()
                .productId(((Number) row[0]).longValue())
                .productName((String) row[1])
                .quantityAdded(((Number) row[2]).longValue())
                .build();
    }

    private ExpenseResponse toExpenseResponse(Expense e) {
        return ExpenseResponse.builder()
                .id(e.getId())
                .title(e.getTitle())
                .description(e.getDescription())
                .amount(e.getAmount())
                .incurredAt(e.getIncurredAt())
                .recordedByUsername(e.getUser() != null ? e.getUser().getUsername() : null)
                .build();
    }

    private static BigDecimal toBigDecimal(Object o) {
        if (o == null) {
            return BigDecimal.ZERO;
        }
        if (o instanceof BigDecimal b) {
            return b;
        }
        if (o instanceof Number n) {
            return BigDecimal.valueOf(n.doubleValue());
        }
        return new BigDecimal(o.toString());
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
