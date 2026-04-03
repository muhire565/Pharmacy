package com.pharmacy.repository;

import com.pharmacy.entity.Supplier;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SupplierRepository extends JpaRepository<Supplier, Long> {

    List<Supplier> findByPharmacyIdOrderByName(Long pharmacyId);

    Optional<Supplier> findByIdAndPharmacyId(Long id, Long pharmacyId);
}
