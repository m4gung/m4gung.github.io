package com.cafe.modules.inventory;

import com.cafe.modules.auth.Outlet;
import com.cafe.modules.auth.Tenant;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "stock_movements")
public class StockMovement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "outlet_id")
    private Outlet outlet;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ingredient_id", nullable = false)
    private Ingredient ingredient;

    @Column(name = "movement_type", nullable = false, length = 50)
    private String movementType; // INITIAL, SALE, PURCHASE, ADJUSTMENT, SPOILED

    @Column(name = "quantity_change", nullable = false, precision = 15, scale = 2)
    private BigDecimal quantityChange;

    @Column(name = "stock_before", nullable = false, precision = 15, scale = 2)
    private BigDecimal stockBefore;

    @Column(name = "stock_after", nullable = false, precision = 15, scale = 2)
    private BigDecimal stockAfter;

    @Column(name = "reference_id", length = 100)
    private String referenceId;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at")
    private Instant createdAt = Instant.now();

    public StockMovement() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Tenant getTenant() { return tenant; }
    public void setTenant(Tenant tenant) { this.tenant = tenant; }

    public Outlet getOutlet() { return outlet; }
    public void setOutlet(Outlet outlet) { this.outlet = outlet; }

    public Ingredient getIngredient() { return ingredient; }
    public void setIngredient(Ingredient ingredient) { this.ingredient = ingredient; }

    public String getMovementType() { return movementType; }
    public void setMovementType(String movementType) { this.movementType = movementType; }

    public BigDecimal getQuantityChange() { return quantityChange; }
    public void setQuantityChange(BigDecimal quantityChange) { this.quantityChange = quantityChange; }

    public BigDecimal getStockBefore() { return stockBefore; }
    public void setStockBefore(BigDecimal stockBefore) { this.stockBefore = stockBefore; }

    public BigDecimal getStockAfter() { return stockAfter; }
    public void setStockAfter(BigDecimal stockAfter) { this.stockAfter = stockAfter; }

    public String getReferenceNumber() { return referenceId; }
    public void setReferenceNumber(String referenceId) { this.referenceId = referenceId; }

    public String getReferenceId() { return referenceId; }
    public void setReferenceId(String referenceId) { this.referenceId = referenceId; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
