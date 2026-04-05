package com.pharmacy.controller;

import com.pharmacy.dto.ExpiringBatchResponse;
import com.pharmacy.dto.FinancialReportResponse;
import com.pharmacy.dto.LowStockProductResponse;
import com.pharmacy.dto.SalesSummaryResponse;
import com.pharmacy.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

@RestController
@RequestMapping("${app.api.prefix}/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/sales/daily")
    @PreAuthorize("hasRole('PHARMACY_ADMIN')")
    public SalesSummaryResponse daily(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) ZoneId zone) {
        return reportService.dailySales(date, zone);
    }

    @GetMapping("/sales/monthly")
    @PreAuthorize("hasRole('PHARMACY_ADMIN')")
    public SalesSummaryResponse monthly(
            @RequestParam int year,
            @RequestParam int month,
            @RequestParam(required = false) ZoneId zone) {
        return reportService.monthlySales(year, month, zone);
    }

    @GetMapping("/financial")
    @PreAuthorize("hasRole('PHARMACY_ADMIN')")
    public FinancialReportResponse financial(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) ZoneId zone,
            @RequestParam(defaultValue = "10") int lowStockThreshold) {
        return reportService.financialReport(from, to, zone, lowStockThreshold);
    }

    @GetMapping("/inventory/low-stock")
    @PreAuthorize("hasRole('PHARMACY_ADMIN')")
    public List<LowStockProductResponse> lowStock(@RequestParam(defaultValue = "10") int threshold) {
        return reportService.lowStock(threshold);
    }

    @GetMapping("/inventory/expiring-soon")
    @PreAuthorize("hasRole('PHARMACY_ADMIN')")
    public List<ExpiringBatchResponse> expiringSoon() {
        return reportService.expiringSoon();
    }
}
