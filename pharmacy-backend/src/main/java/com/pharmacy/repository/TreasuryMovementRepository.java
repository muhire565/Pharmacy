package com.pharmacy.repository;

import com.pharmacy.entity.TreasuryMovement;
import com.pharmacy.entity.TreasuryMovementType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public interface TreasuryMovementRepository extends JpaRepository<TreasuryMovement, Long> {

    @Query("""
            SELECT COALESCE(SUM(t.amount), 0) FROM TreasuryMovement t
            WHERE t.pharmacy.id = :pharmacyId AND t.movementType = :type
            """)
    BigDecimal sumAmountByTypeAllTime(
            @Param("pharmacyId") Long pharmacyId,
            @Param("type") TreasuryMovementType type);

    @Query("""
            SELECT COALESCE(SUM(t.amount), 0) FROM TreasuryMovement t
            WHERE t.pharmacy.id = :pharmacyId AND t.movementType = :type
              AND t.createdAt >= :from AND t.createdAt < :to
            """)
    BigDecimal sumAmountByTypeBetween(
            @Param("pharmacyId") Long pharmacyId,
            @Param("type") TreasuryMovementType type,
            @Param("from") Instant from,
            @Param("to") Instant to);

    @Query("""
            SELECT t FROM TreasuryMovement t
            LEFT JOIN FETCH t.user
            WHERE t.pharmacy.id = :pharmacyId AND t.createdAt >= :from AND t.createdAt < :to
            ORDER BY t.createdAt DESC, t.id DESC
            """)
    List<TreasuryMovement> findByPharmacyAndCreatedBetween(
            @Param("pharmacyId") Long pharmacyId,
            @Param("from") Instant from,
            @Param("to") Instant to);
}
