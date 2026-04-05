package com.pharmacy.service;

import com.pharmacy.dto.TreasuryMovementRequest;
import com.pharmacy.dto.TreasuryMovementResponse;
import com.pharmacy.dto.TreasurySummaryResponse;
import com.pharmacy.entity.PaymentMethod;
import com.pharmacy.entity.TreasuryMovement;
import com.pharmacy.entity.TreasuryMovementType;
import com.pharmacy.entity.User;
import com.pharmacy.repository.SaleRepository;
import com.pharmacy.repository.TreasuryMovementRepository;
import com.pharmacy.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TreasuryService {

    private final TreasuryMovementRepository treasuryMovementRepository;
    private final SaleRepository saleRepository;

    private Long pid() {
        return SecurityUtils.currentPharmacyId();
    }

    private static BigDecimal nz(BigDecimal v) {
        return v == null ? BigDecimal.ZERO : v;
    }

    @Transactional(readOnly = true)
    public TreasurySummaryResponse summary(ZoneId zone) {
        ZoneId z = zone != null ? zone : ZoneId.systemDefault();
        LocalDate today = LocalDate.now(z);
        Instant dayStart = today.atStartOfDay(z).toInstant();
        Instant dayEnd = today.plusDays(1).atStartOfDay(z).toInstant();

        BigDecimal allCash = nz(saleRepository.sumTotalByPaymentMethodAllTime(pid(), PaymentMethod.CASH));
        BigDecimal allMomoCode = nz(saleRepository.sumTotalByPaymentMethodAllTime(pid(), PaymentMethod.MOMO_CODE));
        BigDecimal allMomoPhone = nz(saleRepository.sumTotalByPaymentMethodAllTime(pid(), PaymentMethod.MOMO_PHONE));
        BigDecimal allIn = nz(treasuryMovementRepository.sumAmountByTypeAllTime(pid(), TreasuryMovementType.CASH_IN));
        BigDecimal allBank = nz(treasuryMovementRepository.sumAmountByTypeAllTime(pid(), TreasuryMovementType.BANK_DEPOSIT));
        BigDecimal drawer = allCash.add(allIn).subtract(allBank);

        return TreasurySummaryResponse.builder()
                .estimatedCashDrawer(drawer)
                .allTimeCashSales(allCash)
                .allTimeMomoCodeSales(allMomoCode)
                .allTimeMomoPhoneSales(allMomoPhone)
                .allTimeCashIn(allIn)
                .allTimeBankDeposits(allBank)
                .todayCashSales(nz(saleRepository.sumTotalByPaymentMethodBetween(pid(), PaymentMethod.CASH, dayStart, dayEnd)))
                .todayMomoCodeSales(nz(saleRepository.sumTotalByPaymentMethodBetween(pid(), PaymentMethod.MOMO_CODE, dayStart, dayEnd)))
                .todayMomoPhoneSales(nz(saleRepository.sumTotalByPaymentMethodBetween(pid(), PaymentMethod.MOMO_PHONE, dayStart, dayEnd)))
                .build();
    }

    @Transactional
    public TreasuryMovementResponse create(TreasuryMovementRequest request, User user) {
        TreasuryMovement m = TreasuryMovement.builder()
                .pharmacy(user.getPharmacy())
                .user(user)
                .movementType(request.getType())
                .amount(request.getAmount())
                .note(blankToNull(request.getNote()))
                .build();
        m = treasuryMovementRepository.save(m);
        return toResponse(m);
    }

    @Transactional(readOnly = true)
    public List<TreasuryMovementResponse> list(LocalDate from, LocalDate to, ZoneId zone) {
        ZoneId z = zone != null ? zone : ZoneId.systemDefault();
        LocalDate f = from != null ? from : LocalDate.now(z).minusDays(30);
        LocalDate t = to != null ? to : LocalDate.now(z);
        Instant start = f.atStartOfDay(z).toInstant();
        Instant end = t.plusDays(1).atStartOfDay(z).toInstant();
        return treasuryMovementRepository.findByPharmacyAndCreatedBetween(pid(), start, end).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private static String blankToNull(String s) {
        if (s == null || s.isBlank()) {
            return null;
        }
        return s.trim();
    }

    private TreasuryMovementResponse toResponse(TreasuryMovement m) {
        return TreasuryMovementResponse.builder()
                .id(m.getId())
                .type(m.getMovementType())
                .amount(m.getAmount())
                .note(m.getNote())
                .createdAt(m.getCreatedAt())
                .recordedByUsername(m.getUser() != null ? m.getUser().getUsername() : null)
                .build();
    }
}
