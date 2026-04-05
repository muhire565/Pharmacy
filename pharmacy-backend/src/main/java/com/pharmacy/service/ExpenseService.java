package com.pharmacy.service;

import com.pharmacy.dto.ExpenseRequest;
import com.pharmacy.dto.ExpenseResponse;
import com.pharmacy.entity.Expense;
import com.pharmacy.entity.User;
import com.pharmacy.exception.BusinessRuleException;
import com.pharmacy.exception.ResourceNotFoundException;
import com.pharmacy.repository.ExpenseRepository;
import com.pharmacy.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExpenseService {

    private final ExpenseRepository expenseRepository;

    private Long pid() {
        return SecurityUtils.currentPharmacyId();
    }

    @Transactional
    public ExpenseResponse create(ExpenseRequest request, User user, ZoneId zone) {
        ZoneId z = zone != null ? zone : ZoneId.systemDefault();
        Instant incurred = request.getIncurredDate().atStartOfDay(z).toInstant();
        Expense e = Expense.builder()
                .pharmacy(user.getPharmacy())
                .user(user)
                .title(request.getTitle().trim())
                .description(blankToNull(request.getDescription()))
                .amount(request.getAmount())
                .incurredAt(incurred)
                .build();
        e = expenseRepository.save(e);
        return toResponse(e);
    }

    @Transactional(readOnly = true)
    public List<ExpenseResponse> list(LocalDate from, LocalDate to, ZoneId zone) {
        ZoneId z = zone != null ? zone : ZoneId.systemDefault();
        LocalDate f = from != null ? from : LocalDate.now(z).minusDays(90);
        LocalDate t = to != null ? to : LocalDate.now(z);
        if (f.isAfter(t)) {
            throw new BusinessRuleException("Start date must be on or before end date");
        }
        Instant start = f.atStartOfDay(z).toInstant();
        Instant end = t.plusDays(1).atStartOfDay(z).toInstant();
        return expenseRepository.findByPharmacyAndIncurredBetween(pid(), start, end).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void delete(Long id) {
        Expense e = expenseRepository.findByIdAndPharmacy_Id(id, pid())
                .orElseThrow(() -> new ResourceNotFoundException("Expense not found"));
        expenseRepository.delete(e);
    }

    private static String blankToNull(String s) {
        if (s == null || s.isBlank()) {
            return null;
        }
        return s.trim();
    }

    private ExpenseResponse toResponse(Expense e) {
        return ExpenseResponse.builder()
                .id(e.getId())
                .title(e.getTitle())
                .description(e.getDescription())
                .amount(e.getAmount())
                .incurredAt(e.getIncurredAt())
                .recordedByUsername(e.getUser() != null ? e.getUser().getUsername() : null)
                .build();
    }
}
