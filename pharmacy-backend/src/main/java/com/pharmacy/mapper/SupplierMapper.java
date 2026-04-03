package com.pharmacy.mapper;

import com.pharmacy.dto.SupplierResponse;
import com.pharmacy.entity.Supplier;
import org.springframework.stereotype.Component;

@Component
public class SupplierMapper {

    public SupplierResponse toResponse(Supplier s) {
        if (s == null) {
            return null;
        }
        return SupplierResponse.builder()
                .id(s.getId())
                .name(s.getName())
                .contact(s.getContact())
                .phone(s.getPhone())
                .createdAt(s.getCreatedAt())
                .build();
    }
}
