package com.pharmacy.repository;

import com.pharmacy.entity.StockMovement;
import com.pharmacy.entity.StockMovementType;
import com.pharmacy.entity.StockReference;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface StockMovementRepository extends JpaRepository<StockMovement, Long> {

    List<StockMovement> findByPharmacyIdAndProductIdOrderByCreatedAtDesc(Long pharmacyId, Long productId);

    @Query("""
            SELECT COALESCE(SUM(m.quantity), 0) FROM StockMovement m
            WHERE m.pharmacy.id = :pharmacyId
              AND m.type = :inType AND m.reference = :restockRef
              AND m.createdAt >= :from AND m.createdAt < :to
            """)
    Long sumRestockQuantityBetween(
            @Param("pharmacyId") Long pharmacyId,
            @Param("inType") StockMovementType inType,
            @Param("restockRef") StockReference restockRef,
            @Param("from") Instant from,
            @Param("to") Instant to);

    @Query("""
            SELECT m.product.id, m.product.name, SUM(m.quantity)
            FROM StockMovement m
            WHERE m.pharmacy.id = :pharmacyId
              AND m.type = :inType AND m.reference = :restockRef
              AND m.createdAt >= :from AND m.createdAt < :to
            GROUP BY m.product.id, m.product.name
            ORDER BY SUM(m.quantity) DESC
            """)
    List<Object[]> aggregateRestockByProduct(
            @Param("pharmacyId") Long pharmacyId,
            @Param("inType") StockMovementType inType,
            @Param("restockRef") StockReference restockRef,
            @Param("from") Instant from,
            @Param("to") Instant to);
}
