package com.pharmacy.dto;

import java.util.List;

public record PosDraftCartResponse(List<PosDraftLineResponse> items) {

    public static PosDraftCartResponse empty() {
        return new PosDraftCartResponse(List.of());
    }
}
