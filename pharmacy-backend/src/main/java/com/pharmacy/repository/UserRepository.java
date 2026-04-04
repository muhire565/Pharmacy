package com.pharmacy.repository;

import com.pharmacy.entity.User;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    @EntityGraph(attributePaths = "pharmacy")
    Optional<User> findWithPharmacyByEmailIgnoreCase(String email);

    Optional<User> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByPharmacyIdAndUsernameIgnoreCase(Long pharmacyId, String username);

    Optional<User> findByEmailVerificationTokenHash(String tokenHash);

    Optional<User> findByPasswordResetTokenHash(String tokenHash);
}
