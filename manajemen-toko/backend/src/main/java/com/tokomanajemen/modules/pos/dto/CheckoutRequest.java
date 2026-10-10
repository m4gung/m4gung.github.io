package com.tokomanajemen.modules.pos.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class CheckoutRequest {

    private String invoiceNo;
    private String customerId;
    private String customerName;

    @NotNull(message = "Metode pembayaran wajib diisi")
    private String paymentMethod; // CASH, QRIS, TRANSFER, CREDIT

    private BigDecimal discountAmount = BigDecimal.ZERO;
    private BigDecimal cashReceived = BigDecimal.ZERO;
    private String notes;
    private LocalDate dueDate;

    @NotEmpty(message = "Item keranjang belanja tidak boleh kosong")
    private List<CheckoutItemRequest> items;

    public static class CheckoutItemRequest {
        @NotNull(message = "Product ID wajib diisi")
        private String productId;

        private int quantity;

        public CheckoutItemRequest() {}

        public CheckoutItemRequest(String productId, int quantity) {
            this.productId = productId;
            this.quantity = quantity;
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
    }

    public CheckoutRequest() {}

    public String getInvoiceNo() {
        return invoiceNo;
    }

    public void setInvoiceNo(String invoiceNo) {
        this.invoiceNo = invoiceNo;
    }

    public String getCustomerId() {
        return customerId;
    }

    public void setCustomerId(String customerId) {
        this.customerId = customerId;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public BigDecimal getDiscountAmount() {
        return discountAmount != null ? discountAmount : BigDecimal.ZERO;
    }

    public void setDiscountAmount(BigDecimal discountAmount) {
        this.discountAmount = discountAmount;
    }

    public BigDecimal getCashReceived() {
        return cashReceived != null ? cashReceived : BigDecimal.ZERO;
    }

    public void setCashReceived(BigDecimal cashReceived) {
        this.cashReceived = cashReceived;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public LocalDate getDueDate() {
        return dueDate;
    }

    public void setDueDate(LocalDate dueDate) {
        this.dueDate = dueDate;
    }

    public List<CheckoutItemRequest> getItems() {
        return items;
    }

    public void setItems(List<CheckoutItemRequest> items) {
        this.items = items;
    }
}
