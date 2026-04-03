package com.pharmacy.service;

import com.pharmacy.dto.SaleLineRequest;
import com.pharmacy.dto.SaleRequest;
import com.pharmacy.entity.*;
import com.pharmacy.exception.BusinessRuleException;
import com.pharmacy.repository.BatchRepository;
import com.pharmacy.repository.ProductRepository;
import com.pharmacy.repository.SaleRepository;
import com.pharmacy.repository.StockMovementRepository;
import com.pharmacy.security.SecurityUtils;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SaleServiceTest {

    private static final Long PHARMACY_ID = 1L;

    @Mock
    private SaleRepository saleRepository;
    @Mock
    private ProductRepository productRepository;
    @Mock
    private BatchRepository batchRepository;
    @Mock
    private StockMovementRepository stockMovementRepository;
    @Mock
    private AuditService auditService;
    @Mock
    private LiveUpdatesService liveUpdatesService;
    @Mock
    private PosDraftService posDraftService;

    @InjectMocks
    private SaleService saleService;

    private MockedStatic<SecurityUtils> securityUtils;

    @BeforeEach
    void openSecurityMock() {
        securityUtils = mockStatic(SecurityUtils.class);
        securityUtils.when(SecurityUtils::currentPharmacyId).thenReturn(PHARMACY_ID);
    }

    @AfterEach
    void closeSecurityMock() {
        securityUtils.close();
    }

    @Test
    void createSale_throwsWhenInsufficientStock() {
        Pharmacy pharmacy = Pharmacy.builder().id(PHARMACY_ID).build();
        Product product = Product.builder()
                .id(1L)
                .pharmacy(pharmacy)
                .name("Aspirin")
                .barcode("X1")
                .price(BigDecimal.TEN)
                .build();
        when(productRepository.findByIdAndPharmacyId(1L, PHARMACY_ID)).thenReturn(Optional.of(product));
        when(batchRepository.findSellableBatchesFifo(eq(1L), eq(PHARMACY_ID), any(LocalDate.class)))
                .thenReturn(List.of());

        SaleRequest req = new SaleRequest();
        SaleLineRequest line = new SaleLineRequest();
        line.setProductId(1L);
        line.setQuantity(2);
        req.setItems(List.of(line));

        User cashier = User.builder().id(9L).pharmacy(pharmacy).username("c1").role(Role.CASHIER).build();

        assertThatThrownBy(() -> saleService.createSale(req, cashier))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("Insufficient");

        verify(saleRepository, never()).save(any());
    }

    @Test
    void createSale_deductsFifoAndPersists() {
        Pharmacy pharmacy = Pharmacy.builder().id(PHARMACY_ID).build();
        Product product = Product.builder()
                .id(1L)
                .pharmacy(pharmacy)
                .name("Aspirin")
                .barcode("X1")
                .price(BigDecimal.valueOf(5))
                .build();
        Batch b1 = Batch.builder()
                .id(10L)
                .product(product)
                .batchNumber("B1")
                .expiryDate(LocalDate.now().plusMonths(6))
                .quantity(3)
                .costPrice(BigDecimal.ONE)
                .build();

        when(productRepository.findByIdAndPharmacyId(1L, PHARMACY_ID)).thenReturn(Optional.of(product));
        when(batchRepository.findSellableBatchesFifo(eq(1L), eq(PHARMACY_ID), any(LocalDate.class)))
                .thenReturn(List.of(b1));
        when(batchRepository.findByIdAndPharmacyIdForUpdate(10L, PHARMACY_ID)).thenReturn(Optional.of(b1));
        when(saleRepository.save(any(Sale.class))).thenAnswer(inv -> {
            Sale s = inv.getArgument(0);
            if (s.getId() == null) {
                s.setId(100L);
            }
            return s;
        });

        SaleRequest req = new SaleRequest();
        SaleLineRequest line = new SaleLineRequest();
        line.setProductId(1L);
        line.setQuantity(2);
        req.setItems(List.of(line));

        User cashier = User.builder().id(9L).pharmacy(pharmacy).username("c1").role(Role.CASHIER).build();

        saleService.createSale(req, cashier);

        assertThat(b1.getQuantity()).isEqualTo(1);
        verify(stockMovementRepository, times(1)).save(any(StockMovement.class));
        verify(saleRepository, times(1)).save(any(Sale.class));
        verify(posDraftService, times(1)).clear(PHARMACY_ID);
    }
}
