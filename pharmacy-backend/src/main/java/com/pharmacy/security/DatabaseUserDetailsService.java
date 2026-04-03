package com.pharmacy.security;

import com.pharmacy.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DatabaseUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        var user = userRepository.findWithPharmacyByEmailIgnoreCase(email.trim())
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        return new PharmacyUserDetails(
                user.getId(),
                user.getPharmacy().getId(),
                user.getEmail(),
                user.getPassword(),
                user.getRole()
        );
    }
}
