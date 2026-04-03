package com.pharmacy.repository;

import com.pharmacy.entity.Batch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface BatchRepository extends JpaRepository<Batch, Long> {

    @Query("""
            SELECT b FROM Batch b
            WHERE b.product.id = :productId AND b.product.pharmacy.id = :pharmacyId
            ORDER BY b.createdAt ASC, b.id ASC
            """)
    List<Batch> findByProductIdAndPharmacyIdOrderByFifo(@Param("productId") Long productId, @Param("pharmacyId") Long pharmacyId);

    @Query("""
            SELECT b FROM Batch b
            WHERE b.product.id = :productId AND b.product.pharmacy.id = :pharmacyId
              AND b.quantity > 0
              AND b.expiryDate >= :today
            ORDER BY b.createdAt ASC, b.id ASC
            """)
    List<Batch> findSellableBatchesFifo(
            @Param("productId") Long productId,
            @Param("pharmacyId") Long pharmacyId,
            @Param("today") LocalDate today);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT b FROM Batch b JOIN FETCH b.product p WHERE b.id = :id AND p.pharmacy.id = :pharmacyId")
    Optional<Batch> findByIdAndPharmacyIdForUpdate(@Param("id") Long id, @Param("pharmacyId") Long pharmacyId);

    @Query("""
            SELECT b FROM Batch b JOIN FETCH b.product p
            WHERE p.pharmacy.id = :pharmacyId
              AND b.quantity > 0
              AND b.expiryDate >= :today AND b.expiryDate <= :until
            ORDER BY b.expiryDate ASC, b.id ASC
            """)
    List<Batch> findBatchesExpiringBetween(
            @Param("pharmacyId") Long pharmacyId,
            @Param("today") LocalDate today,
            @Param("until") LocalDate until);

    @Query(value = """
            SELECT p.id, p.name, p.barcode, COALESCE(SUM(b.quantity), 0) AS total_qty
            FROM products p
            LEFT JOIN batches b ON b.product_id = p.id
            WHERE p.pharmacy_id = :pharmacyId
            GROUP BY p.id, p.name, p.barcode
            HAVING COALESCE(SUM(b.quantity), 0) <= :threshold
            ORDER BY total_qty ASC, p.name
            """, nativeQuery = true)
    List<Object[]> findLowStockProductRows(@Param("pharmacyId") Long pharmacyId, @Param("threshold") int threshold);
}
