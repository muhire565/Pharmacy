package com.pharmacy.service;

import com.pharmacy.dto.SaleItemResponse;
import com.pharmacy.dto.SaleLineRequest;
import com.pharmacy.dto.SaleRequest;
import com.pharmacy.dto.SaleResponse;
import com.pharmacy.entity.Batch;
import com.pharmacy.entity.Pharmacy;
import com.pharmacy.entity.Product;
import com.pharmacy.entity.Sale;
import com.pharmacy.entity.SaleItem;
import com.pharmacy.entity.StockMovement;
import com.pharmacy.entity.StockMovementType;
import com.pharmacy.entity.StockReference;
import com.pharmacy.entity.User;
import com.pharmacy.exception.BusinessRuleException;
import com.pharmacy.exception.ResourceNotFoundException;
import com.pharmacy.repository.BatchRepository;
import com.pharmacy.repository.ProductRepository;
import com.pharmacy.repository.SaleRepository;
import com.pharmacy.repository.StockMovementRepository;
import com.pharmacy.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SaleService {

    private final SaleRepository saleRepository;
    private final ProductRepository productRepository;
    private final BatchRepository batchRepository;
    private final StockMovementRepository stockMovementRepository;
    private final AuditService auditService;
    private final LiveUpdatesService liveUpdatesService;
    private final PosDraftService posDraftService;

    private Long pharmacyId() {
        return SecurityUtils.currentPharmacyId();
    }

    @Transactional
    public SaleResponse createSale(SaleRequest request, User cashier) {
        LocalDate today = LocalDate.now();
        List<SaleItem> pendingItems = new ArrayList<>();
        BigDecimal total = BigDecimal.ZERO;
        Pharmacy pharmacy = cashier.getPharmacy();

        for (SaleLineRequest line : request.getItems()) {
            Product product = resolveProduct(line);
            int remaining = line.getQuantity();
            List<Long> batchOrder = batchRepository
                    .findSellableBatchesFifo(product.getId(), pharmacyId(), today).stream()
                    .map(Batch::getId)
                    .toList();

            for (Long batchId : batchOrder) {
                if (remaining <= 0) {
                    break;
                }
                Batch locked = batchRepository.findByIdAndPharmacyIdForUpdate(batchId, pharmacyId())
                        .orElseThrow(() -> new ResourceNotFoundException("Batch not found"));
                if (locked.getExpiryDate().isBefore(today) || locked.getQuantity() <= 0) {
                    continue;
                }
                if (!locked.getProduct().getId().equals(product.getId())) {
                    continue;
                }
                int take = Math.min(remaining, locked.getQuantity());
                locked.setQuantity(locked.getQuantity() - take);
                batchRepository.save(locked);

                BigDecimal unitPrice = product.getPrice();
                total = total.add(unitPrice.multiply(BigDecimal.valueOf(take)));

                pendingItems.add(SaleItem.builder()
                        .product(product)
                        .batch(locked)
                        .quantity(take)
                        .price(unitPrice)
                        .build());

                remaining -= take;
            }

            if (remaining > 0) {
                throw new BusinessRuleException(
                        "Insufficient non-expired stock for product: " + product.getName()
                                + " (barcode " + product.getBarcode() + ")");
            }
        }

        Sale sale = Sale.builder()
                .pharmacy(pharmacy)
                .user(cashier)
                .totalAmount(total)
                .build();
        for (SaleItem si : pendingItems) {
            si.setSale(sale);
            sale.getItems().add(si);
        }
        sale = saleRepository.save(sale);

        for (SaleItem si : sale.getItems()) {
            stockMovementRepository.save(StockMovement.builder()
                    .pharmacy(pharmacy)
                    .product(si.getProduct())
                    .type(StockMovementType.OUT)
                    .quantity(si.getQuantity())
                    .reference(StockReference.SALE)
                    .referenceId(String.valueOf(sale.getId()))
                    .build());
        }

        auditService.record("SALE_CREATE", "Sale", String.valueOf(sale.getId()),
                cashier.getUsername(), "total=" + total);
        posDraftService.clear(pharmacyId());
        liveUpdatesService.saleCreated(pharmacyId(), sale.getId(), sale.getTotalAmount());
        sale.getItems().forEach(i -> liveUpdatesService.inventoryChanged(pharmacyId(), i.getProduct().getId()));

        return toResponse(sale);
    }

    private Product resolveProduct(SaleLineRequest line) {
        if (line.getProductId() != null) {
            return productRepository.findByIdAndPharmacyId(line.getProductId(), pharmacyId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        }
        return productRepository.findByPharmacyIdAndBarcode(pharmacyId(), line.getBarcode().trim())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found for barcode"));
    }

    private SaleResponse toResponse(Sale sale) {
        List<SaleItemResponse> lines = sale.getItems().stream()
                .map(si -> SaleItemResponse.builder()
                        .productId(si.getProduct().getId())
                        .productName(si.getProduct().getName())
                        .batchId(si.getBatch().getId())
                        .batchNumber(si.getBatch().getBatchNumber())
                        .quantity(si.getQuantity())
                        .unitPrice(si.getPrice())
                        .lineTotal(si.getPrice().multiply(BigDecimal.valueOf(si.getQuantity())))
                        .build())
                .toList();
        return SaleResponse.builder()
                .id(sale.getId())
                .totalAmount(sale.getTotalAmount())
                .createdAt(sale.getCreatedAt())
                .cashierUsername(sale.getUser().getUsername())
                .items(lines)
                .build();
    }
}
