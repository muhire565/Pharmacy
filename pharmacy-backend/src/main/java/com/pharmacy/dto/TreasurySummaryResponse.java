package com.pharmacy.dto;

import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;

@Value
@Builder
public class TreasurySummaryResponse {
    /** Cash sales (all time) + cash in (all time) − bank deposits (all time). */
    BigDecimal estimatedCashDrawer;
    BigDecimal allTimeCashSales;
    BigDecimal allTimeMomoCodeSales;
    BigDecimal allTimeMomoPhoneSales;
    BigDecimal allTimeCashIn;
    BigDecimal allTimeBankDeposits;
    BigDecimal todayCashSales;
    BigDecimal todayMomoCodeSales;
    BigDecimal todayMomoPhoneSales;
}
