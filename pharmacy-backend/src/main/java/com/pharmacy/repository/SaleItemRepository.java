package com.pharmacy.repository;

import com.pharmacy.entity.SaleItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface SaleItemRepository extends JpaRepository<SaleItem, Long> {

    @Query("""
            SELECT si.product.id, si.product.name, SUM(si.quantity), SUM(si.price * si.quantity)
            FROM SaleItem si
            WHERE si.sale.pharmacy.id = :pharmacyId
              AND si.sale.createdAt >= :from AND si.sale.createdAt < :to
            GROUP BY si.product.id, si.product.name
            ORDER BY SUM(si.quantity) DESC
            """)
    List<Object[]> aggregateSoldByProduct(
            @Param("pharmacyId") Long pharmacyId,
            @Param("from") Instant from,
            @Param("to") Instant to);
}
