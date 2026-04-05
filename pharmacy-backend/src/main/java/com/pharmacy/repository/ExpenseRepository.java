package com.pharmacy.repository;

import com.pharmacy.entity.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {

    Optional<Expense> findByIdAndPharmacy_Id(Long id, Long pharmacyId);

    @Query("""
            SELECT COALESCE(SUM(e.amount), 0) FROM Expense e
            WHERE e.pharmacy.id = :pharmacyId AND e.incurredAt >= :from AND e.incurredAt < :to
            """)
    BigDecimal sumAmountBetween(
            @Param("pharmacyId") Long pharmacyId,
            @Param("from") Instant from,
            @Param("to") Instant to);

    @Query("""
            SELECT e FROM Expense e
            LEFT JOIN FETCH e.user
            WHERE e.pharmacy.id = :pharmacyId AND e.incurredAt >= :from AND e.incurredAt < :to
            ORDER BY e.incurredAt DESC, e.id DESC
            """)
    List<Expense> findByPharmacyAndIncurredBetween(
            @Param("pharmacyId") Long pharmacyId,
            @Param("from") Instant from,
            @Param("to") Instant to);
}
