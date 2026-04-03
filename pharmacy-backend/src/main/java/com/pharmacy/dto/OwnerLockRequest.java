package com.pharmacy.dto;

import jakarta.validation.constraints.Size;

public record OwnerLockRequest(
        @Size(max = 500)
        String reason
) {
}

