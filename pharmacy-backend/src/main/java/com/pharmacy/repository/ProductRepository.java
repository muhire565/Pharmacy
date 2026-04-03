package com.pharmacy.repository;

import com.pharmacy.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {

    Optional<Product> findByPharmacyIdAndBarcode(Long pharmacyId, String barcode);

    boolean existsByPharmacyIdAndBarcode(Long pharmacyId, String barcode);

    @Query("""
            SELECT DISTINCT p FROM Product p
            LEFT JOIN FETCH p.supplier
            WHERE p.pharmacy.id = :pharmacyId
              AND (LOWER(p.name) LIKE LOWER(CONCAT('%', :q, '%')) OR p.barcode = :q)
            ORDER BY p.name
            """)
    List<Product> searchByPharmacyAndNameOrBarcode(@Param("pharmacyId") Long pharmacyId, @Param("q") String q);

    @Query("SELECT DISTINCT p FROM Product p LEFT JOIN FETCH p.supplier WHERE p.pharmacy.id = :pharmacyId ORDER BY p.name")
    List<Product> findAllByPharmacyIdWithSupplier(@Param("pharmacyId") Long pharmacyId);

    Optional<Product> findByIdAndPharmacyId(Long id, Long pharmacyId);

    @Query(value = """
            SELECT p.id, p.name, p.barcode, p.category, p.price, s.name,
                   COALESCE(SUM(b.quantity), 0),
                   COUNT(b.id),
                   MIN(CASE WHEN b.quantity > 0 THEN b.expiry_date END)
            FROM products p
            LEFT JOIN suppliers s ON s.id = p.supplier_id
            LEFT JOIN batches b ON b.product_id = p.id
            WHERE p.pharmacy_id = :pharmacyId
            GROUP BY p.id, p.name, p.barcode, p.category, p.price, s.name
            ORDER BY p.name
            """, nativeQuery = true)
    List<Object[]> findInventorySummaryRows(@Param("pharmacyId") Long pharmacyId);
}
