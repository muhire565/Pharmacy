package com.pharmacy.service;

import com.pharmacy.websocket.LiveUpdatesWebSocketHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.math.BigDecimal;
import java.time.Instant;

@Service
@RequiredArgsConstructor
public class LiveUpdatesService {

    private final LiveUpdatesWebSocketHandler handler;

    public void saleCreated(Long tenantId, Long saleId, BigDecimal totalAmount) {
        String payload = "{\"type\":\"SALE_CREATED\",\"saleId\":" + saleId +
                ",\"totalAmount\":" + totalAmount +
                ",\"ts\":\"" + Instant.now() + "\"}";
        publishAfterCommit(() -> {
            handler.publishToTenant(tenantId, payload);
            handler.publishToOwners(payload);
        });
    }

    public void inventoryChanged(Long tenantId, Long productId) {
        String payload = "{\"type\":\"INVENTORY_CHANGED\",\"productId\":" + productId +
                ",\"ts\":\"" + Instant.now() + "\"}";
        publishAfterCommit(() -> {
            handler.publishToTenant(tenantId, payload);
            handler.publishToOwners(payload);
        });
    }

    public void pharmacyLockChanged(Long tenantId, boolean locked, String reason) {
        String tenantPayload = "{\"type\":\"PHARMACY_" + (locked ? "LOCKED" : "UNLOCKED") + "\"" +
                ",\"locked\":" + locked +
                ",\"reason\":\"" + escape(reason) + "\"" +
                ",\"ts\":\"" + Instant.now() + "\"}";
        String ownerPayload = "{\"type\":\"OWNER_PHARMACY_UPDATED\"" +
                ",\"pharmacyId\":" + tenantId +
                ",\"locked\":" + locked +
                ",\"reason\":\"" + escape(reason) + "\"" +
                ",\"ts\":\"" + Instant.now() + "\"}";
        publishAfterCommit(() -> {
            handler.publishToTenant(tenantId, tenantPayload);
            handler.publishToOwners(ownerPayload);
        });
    }

    public void posDraftUpdated(Long tenantId) {
        String payload = "{\"type\":\"POS_DRAFT_UPDATED\",\"ts\":\"" + Instant.now() + "\"}";
        publishAfterCommit(() -> handler.publishToTenant(tenantId, payload));
    }

    public void pharmacyUpdated(Long tenantId) {
        String payload = "{\"type\":\"OWNER_PHARMACY_UPDATED\",\"pharmacyId\":" + tenantId +
                ",\"ts\":\"" + Instant.now() + "\"}";
        publishAfterCommit(() -> handler.publishToOwners(payload));
    }

    private String escape(String text) {
        if (text == null) {
            return "";
        }
        return text.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    private void publishAfterCommit(Runnable action) {
        if (!TransactionSynchronizationManager.isActualTransactionActive()) {
            action.run();
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                action.run();
            }
        });
    }
}

