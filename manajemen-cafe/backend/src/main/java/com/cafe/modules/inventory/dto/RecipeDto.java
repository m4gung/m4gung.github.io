package com.cafe.modules.inventory.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class RecipeDto {
    private Long id;

    @NotNull(message = "Produk ID wajib ditentukan")
    private Long productId;

    private String productName;
    private String notes;
    private BigDecimal estimatedCost = BigDecimal.ZERO;

    @NotEmpty(message = "Bahan resep tidak boleh kosong")
    private List<RecipeItemDto> items = new ArrayList<>();

    public RecipeDto() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }

    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public BigDecimal getEstimatedCost() { return estimatedCost; }
    public void setEstimatedCost(BigDecimal estimatedCost) { this.estimatedCost = estimatedCost; }

    public List<RecipeItemDto> getItems() { return items; }
    public void setItems(List<RecipeItemDto> items) { this.items = items; }

    public static class RecipeItemDto {
        private Long id;
        private Long ingredientId;
        private String ingredientName;
        private String unit;
        private BigDecimal quantity;
        private BigDecimal costPerUnit;
        private BigDecimal subtotalCost;

        public RecipeItemDto() {}

        public RecipeItemDto(Long id, Long ingredientId, String ingredientName, String unit, BigDecimal quantity, BigDecimal costPerUnit, BigDecimal subtotalCost) {
            this.id = id;
            this.ingredientId = ingredientId;
            this.ingredientName = ingredientName;
            this.unit = unit;
            this.quantity = quantity;
            this.costPerUnit = costPerUnit;
            this.subtotalCost = subtotalCost;
        }

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

        public BigDecimal getCostPerUnit() { return costPerUnit; }
        public void setCostPerUnit(BigDecimal costPerUnit) { this.costPerUnit = costPerUnit; }

        public BigDecimal getSubtotalCost() { return subtotalCost; }
        public void setSubtotalCost(BigDecimal subtotalCost) { this.subtotalCost = subtotalCost; }
    }
}
