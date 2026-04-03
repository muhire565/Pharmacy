package com.pharmacy.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "pos_draft_carts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PosDraftCart {

    @Id
    @Column(name = "pharmacy_id")
    private Long pharmacyId;

    @Column(name = "lines_json", nullable = false, columnDefinition = "TEXT")
    private String linesJson;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
