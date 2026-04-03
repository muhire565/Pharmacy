package com.pharmacy.config;

import com.pharmacy.entity.Pharmacy;
import com.pharmacy.entity.Role;
import com.pharmacy.entity.User;
import com.pharmacy.repository.PharmacyRepository;
import com.pharmacy.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "app.data.seed", havingValue = "true")
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PharmacyRepository pharmacyRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        // Always seed system owner if missing (works across existing DBs)
        String ownerEmail = "owner@nexpharm.local";
        if (!userRepository.existsByEmailIgnoreCase(ownerEmail)) {
            Pharmacy sys = pharmacyRepository.findByEmailIgnoreCase("system@nexpharm.local")
                    .orElseGet(() -> pharmacyRepository.save(Pharmacy.builder()
                            .name("NexPharm System")
                            .countryCode("US")
                            .phoneE164("+10000000000")
                            .email("system@nexpharm.local")
                            .address("System tenant")
                            .build()));
            userRepository.save(User.builder()
                    .pharmacy(sys)
                    .email(ownerEmail)
                    .username("owner")
                    .password(passwordEncoder.encode("owner123"))
                    .role(Role.SYSTEM_OWNER)
                    .build());
            log.info("Seeded system owner: {} / owner123", ownerEmail);
        }

        // Seed demo tenant only on empty DB (dev convenience)
        if (userRepository.count() == 0) {
            Pharmacy pharmacy = pharmacyRepository.save(Pharmacy.builder()
                    .name("Demo Pharmacy")
                    .countryCode("RW")
                    .phoneE164("+250788000000")
                    .email("admin@demo.pharmacy.local")
                    .address("Demo Street 1, Kigali")
                    .build());

            userRepository.save(User.builder()
                    .pharmacy(pharmacy)
                    .email("admin@demo.pharmacy.local")
                    .username("admin")
                    .password(passwordEncoder.encode("admin123"))
                    .role(Role.PHARMACY_ADMIN)
                    .build());

            userRepository.save(User.builder()
                    .pharmacy(pharmacy)
                    .email("cashier@demo.pharmacy.local")
                    .username("cashier")
                    .password(passwordEncoder.encode("cashier123"))
                    .role(Role.CASHIER)
                    .build());

            log.info("Seeded demo pharmacy and users: admin@demo.pharmacy.local / admin123, cashier@demo.pharmacy.local / cashier123");
        }
    }
}
