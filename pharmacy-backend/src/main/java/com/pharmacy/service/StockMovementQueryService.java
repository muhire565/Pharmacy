package com.pharmacy.service;

import com.pharmacy.dto.StockMovementResponse;
import com.pharmacy.entity.StockMovement;
import com.pharmacy.exception.ResourceNotFoundException;
import com.pharmacy.repository.ProductRepository;
import com.pharmacy.repository.StockMovementRepository;
import com.pharmacy.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StockMovementQueryService {

    private final StockMovementRepository stockMovementRepository;
    private final ProductRepository productRepository;

    @Transactional(readOnly = true)
    public List<StockMovementResponse> byProduct(Long productId) {
        productRepository.findByIdAndPharmacyId(productId, SecurityUtils.currentPharmacyId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        return stockMovementRepository
                .findByPharmacyIdAndProductIdOrderByCreatedAtDesc(SecurityUtils.currentPharmacyId(), productId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private StockMovementResponse toResponse(StockMovement m) {
        return StockMovementResponse.builder()
                .id(m.getId())
                .productId(m.getProduct().getId())
                .productName(m.getProduct().getName())
                .type(m.getType())
                .quantity(m.getQuantity())
                .reference(m.getReference())
                .referenceId(m.getReferenceId())
                .createdAt(m.getCreatedAt())
                .build();
    }
}
