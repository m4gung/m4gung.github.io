package com.cafe.modules.inventory.dto;

import java.math.BigDecimal;
import java.time.Instant;

public class StockMovementDto {
    private Long id;
    private Long ingredientId;
    private String ingredientName;
    private String unit;
    private String movementType;
    private BigDecimal quantityChange;
    private BigDecimal stockBefore;
    private BigDecimal stockAfter;
    private String referenceId;
    private String notes;
    private Instant createdAt;

    public StockMovementDto() {}

    public StockMovementDto(Long id, Long ingredientId, String ingredientName, String unit, String movementType, BigDecimal quantityChange, BigDecimal stockBefore, BigDecimal stockAfter, String referenceId, String notes, Instant createdAt) {
        this.id = id;
        this.ingredientId = ingredientId;
        this.ingredientName = ingredientName;
        this.unit = unit;
        this.movementType = movementType;
        this.quantityChange = quantityChange;
        this.stockBefore = stockBefore;
        this.stockAfter = stockAfter;
        this.referenceId = referenceId;
        this.notes = notes;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getIngredientId() { return ingredientId; }
    public void setIngredientId(Long ingredientId) { this.ingredientId = ingredientId; }

    public String getIngredientName() { return ingredientName; }
    public void setIngredientName(String ingredientName) { this.ingredientName = ingredientName; }

    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }

    public String getMovementType() { return movementType; }
    public void setMovementType(String movementType) { this.movementType = movementType; }

    public BigDecimal getQuantityChange() { return quantityChange; }
    public void setQuantityChange(BigDecimal quantityChange) { this.quantityChange = quantityChange; }

    public BigDecimal getStockBefore() { return stockBefore; }
    public void setStockBefore(BigDecimal stockBefore) { this.stockBefore = stockBefore; }

    public BigDecimal getStockAfter() { return stockAfter; }
    public void setStockAfter(BigDecimal stockAfter) { this.stockAfter = stockAfter; }

    public String getReferenceId() { return referenceId; }
    public void setReferenceId(String referenceId) { this.referenceId = referenceId; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
