package com.pharmacy.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record PosDraftSyncRequest(
        @NotNull @Valid @Size(max = 500) List<PosDraftLineRequest> items
) {
}
