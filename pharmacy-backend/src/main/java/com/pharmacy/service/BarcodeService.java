package com.pharmacy.service;

import com.pharmacy.dto.BarcodeLookupResponse;
import com.pharmacy.dto.BatchResponse;
import com.pharmacy.exception.ResourceNotFoundException;
import com.pharmacy.mapper.BatchMapper;
import com.pharmacy.mapper.ProductMapper;
import com.pharmacy.repository.BatchRepository;
import com.pharmacy.repository.ProductRepository;
import com.pharmacy.security.SecurityUtils;
import com.pharmacy.util.BarcodeImageUtil;
import com.google.zxing.WriterException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BarcodeService {

    private final ProductRepository productRepository;
    private final BatchRepository batchRepository;
    private final ProductMapper productMapper;
    private final BatchMapper batchMapper;

    private Long pid() {
        return SecurityUtils.currentPharmacyId();
    }

    @Transactional(readOnly = true)
    public BarcodeLookupResponse lookup(String barcode) {
        var product = productRepository.findByPharmacyIdAndBarcode(pid(), barcode.trim())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found for barcode"));
        if (product.getSupplier() != null) {
            product.getSupplier().getName();
        }
        LocalDate today = LocalDate.now();
        var batches = batchRepository.findSellableBatchesFifo(product.getId(), pid(), today).stream()
                .map(batchMapper::toResponse)
                .collect(Collectors.toList());
        int total = batches.stream().mapToInt(BatchResponse::getQuantity).sum();
        return BarcodeLookupResponse.builder()
                .product(productMapper.toResponse(product))
                .availableBatches(batches)
                .totalAvailableQuantity(total)
                .build();
    }

    @Transactional(readOnly = true)
    public Map<String, String> generateImagesForProduct(Long productId) throws WriterException, IOException {
        var product = productRepository.findByIdAndPharmacyId(productId, pid())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        String bc = product.getBarcode();
        return Map.of(
                "code128PngBase64", BarcodeImageUtil.code128PngBase64(bc),
                "qrPngBase64", BarcodeImageUtil.qrPngBase64(bc),
                "barcodeText", bc
        );
    }
}
