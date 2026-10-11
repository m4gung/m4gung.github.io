package com.cafe.modules.inventory.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class IngredientDto {
    private Long id;

    @NotBlank(message = "Nama bahan baku wajib diisi")
    private String name;

    @NotBlank(message = "Satuan bahan (gram, ml, pcs) wajib diisi")
    private String unit;

    private BigDecimal costPerUnit = BigDecimal.ZERO;
    private BigDecimal minimumStock = BigDecimal.ZERO;

    @NotNull(message = "Stok saat ini wajib diisi")
    private BigDecimal currentStock = BigDecimal.ZERO;

    private Boolean isActive = true;
    private Boolean isLowStock = false;

    public IngredientDto() {}

    public IngredientDto(Long id, String name, String unit, BigDecimal costPerUnit, BigDecimal minimumStock, BigDecimal currentStock, Boolean isActive) {
        this.id = id;
        this.name = name;
        this.unit = unit;
        this.costPerUnit = costPerUnit;
        this.minimumStock = minimumStock;
        this.currentStock = currentStock;
        this.isActive = isActive;
        this.isLowStock = currentStock != null && minimumStock != null && currentStock.compareTo(minimumStock) <= 0;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }

    public BigDecimal getCostPerUnit() { return costPerUnit; }
    public void setCostPerUnit(BigDecimal costPerUnit) { this.costPerUnit = costPerUnit; }

    public BigDecimal getMinimumStock() { return minimumStock; }
    public void setMinimumStock(BigDecimal minimumStock) { this.minimumStock = minimumStock; }

    public BigDecimal getCurrentStock() { return currentStock; }
    public void setCurrentStock(BigDecimal currentStock) {
        this.currentStock = currentStock;
        if (this.currentStock != null && this.minimumStock != null) {
            this.isLowStock = this.currentStock.compareTo(this.minimumStock) <= 0;
        }
    }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }

    public Boolean getIsLowStock() { return isLowStock; }
    public void setIsLowStock(Boolean isLowStock) { this.isLowStock = isLowStock; }
}
