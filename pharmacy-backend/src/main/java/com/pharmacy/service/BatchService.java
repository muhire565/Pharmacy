package com.pharmacy.service;

import com.pharmacy.dto.BatchRequest;
import com.pharmacy.dto.BatchResponse;
import com.pharmacy.entity.Batch;
import com.pharmacy.entity.Pharmacy;
import com.pharmacy.entity.Product;
import com.pharmacy.entity.StockMovement;
import com.pharmacy.entity.StockMovementType;
import com.pharmacy.entity.StockReference;
import com.pharmacy.exception.ResourceNotFoundException;
import com.pharmacy.mapper.BatchMapper;
import com.pharmacy.repository.BatchRepository;
import com.pharmacy.repository.ProductRepository;
import com.pharmacy.repository.StockMovementRepository;
import com.pharmacy.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BatchService {

    private final BatchRepository batchRepository;
    private final ProductRepository productRepository;
    private final StockMovementRepository stockMovementRepository;
    private final BatchMapper batchMapper;
    private final AuditService auditService;
    private final LiveUpdatesService liveUpdatesService;

    private Long pid() {
        return SecurityUtils.currentPharmacyId();
    }

    @Transactional(readOnly = true)
    public List<BatchResponse> listByProduct(Long productId) {
        productRepository.findByIdAndPharmacyId(productId, pid())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        return batchRepository.findByProductIdAndPharmacyIdOrderByFifo(productId, pid()).stream()
                .map(batchMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public BatchResponse create(BatchRequest request, String username) {
        Product product = productRepository.findByIdAndPharmacyId(request.getProductId(), pid())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        Pharmacy pharmacy = product.getPharmacy();
        Batch batch = Batch.builder()
                .product(product)
                .batchNumber(request.getBatchNumber().trim())
                .expiryDate(request.getExpiryDate())
                .quantity(request.getQuantity())
                .costPrice(request.getCostPrice())
                .build();
        batch = batchRepository.save(batch);
        stockMovementRepository.save(StockMovement.builder()
                .pharmacy(pharmacy)
                .product(product)
                .type(StockMovementType.IN)
                .quantity(request.getQuantity())
                .reference(StockReference.RESTOCK)
                .referenceId("BATCH-" + batch.getId())
                .build());
        auditService.record("BATCH_CREATE", "Batch", String.valueOf(batch.getId()), username,
                product.getName() + " qty=" + request.getQuantity());
        liveUpdatesService.inventoryChanged(pid(), product.getId());
        return batchMapper.toResponse(batch);
    }

    @Transactional(readOnly = true)
    public List<BatchResponse> availableForProduct(Long productId) {
        productRepository.findByIdAndPharmacyId(productId, pid())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        LocalDate today = LocalDate.now();
        return batchRepository.findSellableBatchesFifo(productId, pid(), today).stream()
                .map(batchMapper::toResponse)
                .collect(Collectors.toList());
    }
}
