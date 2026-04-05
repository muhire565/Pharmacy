package com.pharmacy.service;

import com.pharmacy.dto.CashierCreateRequest;
import com.pharmacy.dto.CashierResponse;
import com.pharmacy.entity.Role;
import com.pharmacy.entity.User;
import com.pharmacy.exception.BusinessRuleException;
import com.pharmacy.exception.ResourceNotFoundException;
import com.pharmacy.repository.UserRepository;
import com.pharmacy.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PharmacyCashierService {

    private static final Pattern USERNAME = Pattern.compile("^[a-zA-Z0-9._-]{2,64}$");
    private static final Pattern PASSWORD_COMPLEXITY = Pattern.compile("^(?=.*[A-Za-z])(?=.*\\d).{8,}$");

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    private Long pid() {
        return SecurityUtils.currentPharmacyId();
    }

    @Transactional(readOnly = true)
    public List<CashierResponse> listCashiers() {
        return userRepository.findByPharmacyIdAndRoleOrderByUsernameAsc(pid(), Role.CASHIER).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public CashierResponse createCashier(CashierCreateRequest request, String actorUsername) {
        User admin = userRepository.findById(SecurityUtils.currentUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (admin.getRole() != Role.PHARMACY_ADMIN) {
            throw new BusinessRuleException("Only pharmacy admins can create cashiers");
        }

        String email = request.getEmail() == null ? "" : request.getEmail().trim().toLowerCase();
        if (email.isEmpty()) {
            throw new BusinessRuleException("Email is required");
        }
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new BusinessRuleException("This email is already in use");
        }

        String username = request.getUsername() == null ? "" : request.getUsername().trim();
        if (!USERNAME.matcher(username).matches()) {
            throw new BusinessRuleException(
                    "Username must be 2–64 characters: letters, numbers, dot, underscore, hyphen only");
        }
        if (userRepository.existsByPharmacyIdAndUsernameIgnoreCase(pid(), username)) {
            throw new BusinessRuleException("This username is already taken in your pharmacy");
        }

        String rawPassword = request.getPassword();
        if (rawPassword == null || !PASSWORD_COMPLEXITY.matcher(rawPassword).matches()) {
            throw new BusinessRuleException("Password must be at least 8 characters and include letters and numbers");
        }

        User cashier = User.builder()
                .pharmacy(admin.getPharmacy())
                .email(email)
                .username(username)
                .password(passwordEncoder.encode(rawPassword))
                .role(Role.CASHIER)
                .emailVerified(true)
                .mfaEnabled(false)
                .build();
        cashier = userRepository.save(cashier);

        auditService.record("CASHIER_CREATE", "User", String.valueOf(cashier.getId()), actorUsername,
                "email=" + email + " username=" + username);

        return toResponse(cashier);
    }

    @Transactional
    public void deleteCashier(Long cashierUserId, String actorUsername) {
        User u = userRepository.findByIdAndPharmacyId(cashierUserId, pid())
                .orElseThrow(() -> new ResourceNotFoundException("Cashier not found"));
        if (u.getRole() != Role.CASHIER) {
            throw new BusinessRuleException("Only cashier accounts can be removed here");
        }
        if (u.getId().equals(SecurityUtils.currentUserId())) {
            throw new BusinessRuleException("You cannot remove your own account");
        }
        userRepository.delete(u);
        auditService.record("CASHIER_DELETE", "User", String.valueOf(cashierUserId), actorUsername,
                "email=" + u.getEmail());
    }

    private CashierResponse toResponse(User u) {
        return CashierResponse.builder()
                .id(u.getId())
                .email(u.getEmail())
                .username(u.getUsername())
                .createdAt(u.getCreatedAt())
                .build();
    }
}
