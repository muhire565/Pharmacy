package com.pharmacy.repository;

import com.pharmacy.entity.Sale;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public interface SaleRepository extends JpaRepository<Sale, Long> {

    @Query("""
            SELECT COALESCE(SUM(s.totalAmount), 0) FROM Sale s
            WHERE s.pharmacy.id = :pharmacyId AND s.createdAt >= :from AND s.createdAt < :to
            """)
    BigDecimal sumTotalBetween(
            @Param("pharmacyId") Long pharmacyId,
            @Param("from") Instant from,
            @Param("to") Instant to);

    @Query("""
            SELECT s FROM Sale s
            JOIN FETCH s.user
            WHERE s.pharmacy.id = :pharmacyId AND s.createdAt >= :from AND s.createdAt < :to
            ORDER BY s.createdAt DESC
            """)
    List<Sale> findByPharmacyAndCreatedAtBetween(
            @Param("pharmacyId") Long pharmacyId,
            @Param("from") Instant from,
            @Param("to") Instant to);
}
