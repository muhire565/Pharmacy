package com.pharmacy.dto;

import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Value
@Builder
public class FinancialReportResponse {
    ReportPharmacyHeaderResponse pharmacy;
    Instant periodFrom;
    Instant periodTo;
    BigDecimal totalSales;
    long saleCount;
    BigDecimal totalExpenses;
    BigDecimal netAmount;
    long inventoryUnitsAdded;
    List<MedicineSoldRowResponse> medicinesSold;
    List<ExpenseResponse> expenses;
    List<InventoryAddedRowResponse> inventoryAdded;
    List<LowStockProductResponse> lowStock;
    List<SaleResponse> sales;
}
