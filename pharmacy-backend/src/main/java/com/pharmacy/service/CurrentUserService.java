package com.pharmacy.service;

import com.pharmacy.entity.User;
import com.pharmacy.exception.ResourceNotFoundException;
import com.pharmacy.repository.UserRepository;
import com.pharmacy.security.PharmacyUserDetails;
import com.pharmacy.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CurrentUserService {

    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public User requireCurrentUser() {
        PharmacyUserDetails p = SecurityUtils.requirePharmacyUser();
        return userRepository.findWithPharmacyByEmailIgnoreCase(p.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("Current user not found"));
    }
}
