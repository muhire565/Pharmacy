package com.pharmacy.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pharmacy.dto.PosDraftCartResponse;
import com.pharmacy.dto.PosDraftLineRequest;
import com.pharmacy.dto.PosDraftLineResponse;
import com.pharmacy.entity.PosDraftCart;
import com.pharmacy.entity.Product;
import com.pharmacy.exception.BusinessRuleException;
import com.pharmacy.repository.PosDraftCartRepository;
import com.pharmacy.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PosDraftService {

    private static final TypeReference<List<PosDraftLineResponse>> LINE_LIST_TYPE =
            new TypeReference<>() {};

    private final PosDraftCartRepository posDraftCartRepository;
    private final ProductRepository productRepository;
    private final ObjectMapper objectMapper;
    private final LiveUpdatesService liveUpdatesService;

    @Transactional(readOnly = true)
    public PosDraftCartResponse get(Long pharmacyId) {
        return posDraftCartRepository.findById(pharmacyId)
                .map(c -> new PosDraftCartResponse(parseLines(c.getLinesJson())))
                .orElse(PosDraftCartResponse.empty());
    }

    @Transactional
    public PosDraftCartResponse sync(Long pharmacyId, List<PosDraftLineRequest> items) {
        Map<Long, Integer> merged = new HashMap<>();
        for (PosDraftLineRequest line : items) {
            merged.merge(line.productId(), line.quantity(), Integer::sum);
        }

        List<PosDraftLineResponse> lines = new ArrayList<>();
        for (Map.Entry<Long, Integer> e : merged.entrySet()) {
            if (e.getValue() == null || e.getValue() < 1) {
                continue;
            }
            Product p = productRepository.findByIdAndPharmacyId(e.getKey(), pharmacyId)
                    .orElseThrow(() -> new BusinessRuleException("Unknown product in cart: " + e.getKey()));
            lines.add(new PosDraftLineResponse(
                    p.getId(),
                    p.getName(),
                    p.getBarcode(),
                    p.getPrice(),
                    e.getValue()));
        }

        if (lines.isEmpty()) {
            if (posDraftCartRepository.existsById(pharmacyId)) {
                posDraftCartRepository.deleteById(pharmacyId);
            }
            liveUpdatesService.posDraftUpdated(pharmacyId);
            return PosDraftCartResponse.empty();
        }

        String json;
        try {
            json = objectMapper.writeValueAsString(lines);
        } catch (IOException ex) {
            throw new IllegalStateException("Failed to serialize draft cart", ex);
        }

        PosDraftCart row = posDraftCartRepository.findById(pharmacyId).orElseGet(() ->
                PosDraftCart.builder().pharmacyId(pharmacyId).build());
        row.setLinesJson(json);
        row.setUpdatedAt(Instant.now());
        posDraftCartRepository.save(row);

        liveUpdatesService.posDraftUpdated(pharmacyId);
        return new PosDraftCartResponse(lines);
    }

    @Transactional
    public void clear(Long pharmacyId) {
        if (posDraftCartRepository.existsById(pharmacyId)) {
            posDraftCartRepository.deleteById(pharmacyId);
        }
        liveUpdatesService.posDraftUpdated(pharmacyId);
    }

    private List<PosDraftLineResponse> parseLines(String json) {
        if (json == null || json.isBlank() || "[]".equals(json.trim())) {
            return List.of();
        }
        try {
            return objectMapper.readValue(json, LINE_LIST_TYPE);
        } catch (IOException e) {
            return List.of();
        }
    }
}
