package com.cafe.modules.purchasing.dto;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class PurchaseItemDto {
    private Long id;

    @NotNull(message = "ID bahan baku wajib dipilih")
    private Long ingredientId;

    private String ingredientName;
    private String unit;

    @NotNull(message = "Kuantitas wajib diisi")
    private BigDecimal quantity;

    @NotNull(message = "Harga beli satuan wajib diisi")
    private BigDecimal unitCost;

    private BigDecimal subtotal;

    public PurchaseItemDto() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getIngredientId() { return ingredientId; }
    public void setIngredientId(Long ingredientId) { this.ingredientId = ingredientId; }

    public String getIngredientName() { return ingredientName; }
    public void setIngredientName(String ingredientName) { this.ingredientName = ingredientName; }

    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }

    public BigDecimal getQuantity() { return quantity; }
    public void setQuantity(BigDecimal quantity) { this.quantity = quantity; }

    public BigDecimal getUnitCost() { return unitCost; }
    public void setUnitCost(BigDecimal unitCost) { this.unitCost = unitCost; }

    public BigDecimal getSubtotal() { return subtotal; }
    public void setSubtotal(BigDecimal subtotal) { this.subtotal = subtotal; }
}
