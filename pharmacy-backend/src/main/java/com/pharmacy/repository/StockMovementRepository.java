package com.pharmacy.repository;

import com.pharmacy.entity.StockMovement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StockMovementRepository extends JpaRepository<StockMovement, Long> {

    List<StockMovement> findByPharmacyIdAndProductIdOrderByCreatedAtDesc(Long pharmacyId, Long productId);
}
