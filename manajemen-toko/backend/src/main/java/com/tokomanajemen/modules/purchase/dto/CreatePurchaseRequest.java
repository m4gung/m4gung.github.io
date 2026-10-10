package com.tokomanajemen.modules.purchase.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class CreatePurchaseRequest {

    private String purchaseNo;
    private String supplierId;

    @NotNull(message = "Nama supplier wajib diisi")
    private String supplierName;

    @NotNull(message = "Metode pembayaran wajib diisi")
    private String paymentMethod; // CASH, TRANSFER, CREDIT

    private String paymentStatus = "PAID"; // PAID, UNPAID
    private LocalDate dueDate;
    private String notes;

    @NotEmpty(message = "Item pembelian tidak boleh kosong")
    private List<PurchaseItemRequest> items;

    public static class PurchaseItemRequest {
        @NotNull(message = "Product ID wajib diisi")
        private String productId;

        private int quantity;
        private BigDecimal costPrice;

        public PurchaseItemRequest() {}

        public PurchaseItemRequest(String productId, int quantity, BigDecimal costPrice) {
            this.productId = productId;
            this.quantity = quantity;
            this.costPrice = costPrice;
        }

        public String getProductId() {
            return productId;
        }

        public void setProductId(String productId) {
            this.productId = productId;
        }

        public int getQuantity() {
            return quantity;
        }

        public void setQuantity(int quantity) {
            this.quantity = quantity;
        }

        public BigDecimal getCostPrice() {
            return costPrice;
        }

        public void setCostPrice(BigDecimal costPrice) {
            this.costPrice = costPrice;
        }
    }

    public CreatePurchaseRequest() {}

    public String getPurchaseNo() {
        return purchaseNo;
    }

    public void setPurchaseNo(String purchaseNo) {
        this.purchaseNo = purchaseNo;
    }

    public String getSupplierId() {
        return supplierId;
    }

    public void setSupplierId(String supplierId) {
        this.supplierId = supplierId;
    }

    public String getSupplierName() {
        return supplierName;
    }

    public void setSupplierName(String supplierName) {
        this.supplierName = supplierName;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public String getPaymentStatus() {
        return paymentStatus;
    }

    public void setPaymentStatus(String paymentStatus) {
        this.paymentStatus = paymentStatus;
    }

    public LocalDate getDueDate() {
        return dueDate;
    }

    public void setDueDate(LocalDate dueDate) {
        this.dueDate = dueDate;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public List<PurchaseItemRequest> getItems() {
        return items;
    }

    public void setItems(List<PurchaseItemRequest> items) {
        this.items = items;
    }
}
