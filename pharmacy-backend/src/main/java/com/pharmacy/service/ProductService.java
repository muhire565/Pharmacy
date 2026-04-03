package com.pharmacy.service;

import com.pharmacy.dto.ProductRequest;
import com.pharmacy.dto.ProductResponse;
import com.pharmacy.entity.Pharmacy;
import com.pharmacy.entity.Product;
import com.pharmacy.entity.Supplier;
import com.pharmacy.exception.BusinessRuleException;
import com.pharmacy.exception.ResourceNotFoundException;
import com.pharmacy.mapper.ProductMapper;
import com.pharmacy.repository.PharmacyRepository;
import com.pharmacy.repository.ProductRepository;
import com.pharmacy.repository.SupplierRepository;
import com.pharmacy.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final SupplierRepository supplierRepository;
    private final PharmacyRepository pharmacyRepository;
    private final ProductMapper productMapper;
    private final AuditService auditService;

    private Long pid() {
        return SecurityUtils.currentPharmacyId();
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> findAll() {
        return productRepository.findAllByPharmacyIdWithSupplier(pid()).stream()
                .map(productMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ProductResponse getById(Long id) {
        Product p = productRepository.findByIdAndPharmacyId(id, pid())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        if (p.getSupplier() != null) {
            p.getSupplier().getName();
        }
        return productMapper.toResponse(p);
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> search(String q) {
        if (q == null || q.isBlank()) {
            return findAll();
        }
        return productRepository.searchByPharmacyAndNameOrBarcode(pid(), q.trim()).stream()
                .map(productMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public ProductResponse create(ProductRequest request, String username) {
        String barcode = resolveBarcodeForCreate(request.getBarcode());
        if (productRepository.existsByPharmacyIdAndBarcode(pid(), barcode)) {
            throw new BusinessRuleException("Barcode already exists");
        }
        Pharmacy pharmacy = pharmacyRepository.getReferenceById(pid());
        Product p = Product.builder()
                .pharmacy(pharmacy)
                .name(request.getName().trim())
                .description(request.getDescription())
                .category(request.getCategory())
                .barcode(barcode)
                .price(request.getPrice())
                .supplier(resolveSupplier(request.getSupplierId()))
                .build();
        p = productRepository.save(p);
        auditService.record("PRODUCT_CREATE", "Product", String.valueOf(p.getId()), username, p.getName());
        return productMapper.toResponse(p);
    }

    @Transactional
    public ProductResponse update(Long id, ProductRequest request, String username) {
        Product p = productRepository.findByIdAndPharmacyId(id, pid())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        String barcode = resolveBarcodeForUpdate(request.getBarcode(), p.getBarcode());
        productRepository.findByPharmacyIdAndBarcode(pid(), barcode)
                .ifPresent(other -> {
                    if (!other.getId().equals(id)) {
                        throw new BusinessRuleException("Barcode already exists");
                    }
                });
        p.setName(request.getName().trim());
        p.setDescription(request.getDescription());
        p.setCategory(request.getCategory());
        p.setBarcode(barcode);
        p.setPrice(request.getPrice());
        p.setSupplier(resolveSupplier(request.getSupplierId()));
        p = productRepository.save(p);
        auditService.record("PRODUCT_UPDATE", "Product", String.valueOf(p.getId()), username, p.getName());
        return productMapper.toResponse(p);
    }

    @Transactional
    public void delete(Long id, String username) {
        Product p = productRepository.findByIdAndPharmacyId(id, pid())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        productRepository.delete(p);
        auditService.record("PRODUCT_DELETE", "Product", String.valueOf(id), username, p.getName());
    }

    @Transactional(readOnly = true)
    public String suggestUniqueBarcode() {
        return nextUniqueBarcode();
    }

    private String nextUniqueBarcode() {
        int attempts = 0;
        String candidate;
        do {
            candidate = "PH-" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase();
            if (++attempts > 200) {
                throw new BusinessRuleException("Could not generate a unique barcode");
            }
        } while (productRepository.existsByPharmacyIdAndBarcode(pid(), candidate));
        return candidate;
    }

    private String resolveBarcodeForCreate(String raw) {
        if (raw == null || raw.isBlank()) {
            return nextUniqueBarcode();
        }
        return raw.trim();
    }

    private String resolveBarcodeForUpdate(String raw, String current) {
        if (raw == null || raw.isBlank()) {
            if (current == null || current.isBlank()) {
                return nextUniqueBarcode();
            }
            return current;
        }
        return raw.trim();
    }

    @Transactional
    public ProductResponse regenerateBarcode(Long id, String username) {
        Product p = productRepository.findByIdAndPharmacyId(id, pid())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        String newBc;
        int attempts = 0;
        do {
            newBc = "PH-" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase();
            if (++attempts > 200) {
                throw new BusinessRuleException("Could not generate a unique barcode");
            }
        } while (isBarcodeTakenByOtherProduct(newBc, id));
        p.setBarcode(newBc);
        p = productRepository.save(p);
        auditService.record("PRODUCT_BARCODE_REGEN", "Product", String.valueOf(id), username, newBc);
        return productMapper.toResponse(p);
    }

    private boolean isBarcodeTakenByOtherProduct(String barcode, Long productId) {
        return productRepository.findByPharmacyIdAndBarcode(pid(), barcode)
                .map(other -> !other.getId().equals(productId))
                .orElse(false);
    }

    private Supplier resolveSupplier(Long supplierId) {
        if (supplierId == null) {
            return null;
        }
        return supplierRepository.findByIdAndPharmacyId(supplierId, pid())
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found"));
    }
}
