package com.pharmacy.mapper;

import com.pharmacy.dto.BatchResponse;
import com.pharmacy.entity.Batch;
import org.springframework.stereotype.Component;

@Component
public class BatchMapper {

    public BatchResponse toResponse(Batch b) {
        if (b == null) {
            return null;
        }
        return BatchResponse.builder()
                .id(b.getId())
                .productId(b.getProduct().getId())
                .productName(b.getProduct().getName())
                .batchNumber(b.getBatchNumber())
                .expiryDate(b.getExpiryDate())
                .quantity(b.getQuantity())
                .costPrice(b.getCostPrice())
                .createdAt(b.getCreatedAt())
                .build();
    }
}
