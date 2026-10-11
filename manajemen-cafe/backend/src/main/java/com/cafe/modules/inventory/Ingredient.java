package com.cafe.modules.inventory;

import com.cafe.modules.auth.Tenant;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "ingredients")
public class Ingredient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(nullable = false, length = 30)
    private String unit; // GRAM, ML, PCS, TSP, PORTION

    @Column(name = "cost_per_unit", precision = 15, scale = 2)
    private BigDecimal costPerUnit = BigDecimal.ZERO;

    @Column(name = "minimum_stock", precision = 15, scale = 2)
    private BigDecimal minimumStock = BigDecimal.ZERO;

    @Column(name = "current_stock", precision = 15, scale = 2)
    private BigDecimal currentStock = BigDecimal.ZERO;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "created_at")
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    private Instant updatedAt = Instant.now();

    public Ingredient() {}

    public Ingredient(Tenant tenant, String name, String unit, BigDecimal costPerUnit, BigDecimal minimumStock, BigDecimal currentStock) {
        this.tenant = tenant;
        this.name = name;
        this.unit = unit;
        this.costPerUnit = costPerUnit;
        this.minimumStock = minimumStock;
        this.currentStock = currentStock;
        this.isActive = true;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Tenant getTenant() { return tenant; }
    public void setTenant(Tenant tenant) { this.tenant = tenant; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }

    public BigDecimal getCostPerUnit() { return costPerUnit; }
    public void setCostPerUnit(BigDecimal costPerUnit) { this.costPerUnit = costPerUnit; }

    public BigDecimal getMinimumStock() { return minimumStock; }
    public void setMinimumStock(BigDecimal minimumStock) { this.minimumStock = minimumStock; }

    public BigDecimal getCurrentStock() { return currentStock; }
    public void setCurrentStock(BigDecimal currentStock) { this.currentStock = currentStock; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
