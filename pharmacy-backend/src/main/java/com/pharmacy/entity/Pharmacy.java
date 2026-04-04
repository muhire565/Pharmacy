package com.pharmacy.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "pharmacies", indexes = {
        @Index(name = "idx_pharmacies_email", columnList = "email", unique = true),
        @Index(name = "idx_pharmacies_name", columnList = "name", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Pharmacy {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String name;

    @Column(name = "country_code", nullable = false, length = 2)
    private String countryCode;

    @Column(name = "phone_e164", nullable = false, length = 20)
    private String phoneE164;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @Column(name = "logo_path", length = 500)
    private String logoPath;

    @Column(nullable = false, length = 250)
    private String address;

    /** ISO 4217: RWF, UGX, USD */
    @Column(name = "currency_code", nullable = false, length = 3)
    private String currencyCode;

    @Column(nullable = false)
    private boolean locked;

    @Column(name = "locked_reason", length = 500)
    private String lockedReason;

    @Column(name = "locked_at")
    private Instant lockedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (currencyCode == null || currencyCode.isBlank()) {
            currencyCode = "RWF";
        } else {
            currencyCode = currencyCode.trim().toUpperCase();
        }
    }
}
