package com.pharmacy.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public final class SecurityUtils {

    private SecurityUtils() {
    }

    public static PharmacyUserDetails requirePharmacyUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof PharmacyUserDetails p)) {
            throw new IllegalStateException("Not authenticated as pharmacy user");
        }
        return p;
    }

    public static Long currentPharmacyId() {
        return requirePharmacyUser().getPharmacyId();
    }

    public static Long currentUserId() {
        return requirePharmacyUser().getUserId();
    }
}
