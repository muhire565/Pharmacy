package com.pharmacy.util;

import com.pharmacy.exception.BusinessRuleException;

import java.util.Set;

public final class PharmacyCurrency {

    public static final String DEFAULT = "RWF";
    private static final Set<String> ALLOWED = Set.of("RWF", "UGX", "USD");

    private PharmacyCurrency() {
    }

    public static String normalizeOrDefault(String raw) {
        String c = raw == null ? "" : raw.trim().toUpperCase();
        if (c.isEmpty()) {
            return DEFAULT;
        }
        if (!ALLOWED.contains(c)) {
            throw new BusinessRuleException("Currency must be RWF, UGX, or USD");
        }
        return c;
    }

    /** For updates: blank keeps {@code current}; otherwise validates. */
    public static String normalizeForUpdate(String raw, String current) {
        if (raw == null || raw.isBlank()) {
            return current != null && !current.isBlank() ? current : DEFAULT;
        }
        return normalizeOrDefault(raw);
    }
}
