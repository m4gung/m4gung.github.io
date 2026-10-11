package com.cafe.modules.inventory.dto;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class StockAdjustmentRequest {

    @NotNull(message = "Bahan ID wajib diisi")
    private Long ingredientId;

    @NotNull(message = "Perubahan kuantitas (+/-) wajib diisi")
    private BigDecimal quantityChange;

    private String movementType = "ADJUSTMENT"; // ADJUSTMENT, SPOILED, PURCHASE
    private String notes;

    public StockAdjustmentRequest() {}

    public Long getIngredientId() { return ingredientId; }
    public void setIngredientId(Long ingredientId) { this.ingredientId = ingredientId; }

    public BigDecimal getQuantityChange() { return quantityChange; }
    public void setQuantityChange(BigDecimal quantityChange) { this.quantityChange = quantityChange; }

    public String getMovementType() { return movementType; }
    public void setMovementType(String movementType) { this.movementType = movementType; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
