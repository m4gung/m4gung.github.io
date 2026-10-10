package com.tokomanajemen.modules.inventory.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class StockAdjustmentRequest {

    @NotBlank(message = "Product ID wajib diisi")
    private String productId;

    @NotNull(message = "Stok baru wajib diisi")
    @Min(value = 0, message = "Stok barang tidak boleh negatif")
    private Integer newStock;

    @NotBlank(message = "Alasan penyesuaian wajib diisi")
    private String reason; // RUSAK, HILANG, KOREKSI_OPNAME, SALAH_INPUT, LAINNYA

    private String notes;

    public StockAdjustmentRequest() {}

    public StockAdjustmentRequest(String productId, Integer newStock, String reason, String notes) {
        this.productId = productId;
        this.newStock = newStock;
        this.reason = reason;
        this.notes = notes;
    }

    public String getProductId() {
        return productId;
    }

    public void setProductId(String productId) {
        this.productId = productId;
    }

    public Integer getNewStock() {
        return newStock;
    }

    public void setNewStock(Integer newStock) {
        this.newStock = newStock;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
