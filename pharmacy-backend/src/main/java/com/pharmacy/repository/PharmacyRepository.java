package com.pharmacy.repository;

import com.pharmacy.entity.Pharmacy;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PharmacyRepository extends JpaRepository<Pharmacy, Long> {

    boolean existsByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);

    boolean existsByEmailIgnoreCase(String email);

    Optional<Pharmacy> findByEmailIgnoreCase(String email);
}
