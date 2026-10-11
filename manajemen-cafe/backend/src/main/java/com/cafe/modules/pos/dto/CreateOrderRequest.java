package com.cafe.modules.pos.dto;

import jakarta.validation.constraints.NotEmpty;
import java.math.BigDecimal;
import java.util.List;

public class CreateOrderRequest {

    private Long outletId;
    private String orderType = "DINE_IN"; // DINE_IN, TAKEAWAY
    private Long tableId;
    private String customerName;
    private String customerPhone;
    private BigDecimal discountAmount = BigDecimal.ZERO;
    private String notes;

    @NotEmpty(message = "Keranjang pesanan tidak boleh kosong")
    private List<ItemRequest> items;

    private PaymentRequest payment;

    public CreateOrderRequest() {}

    public Long getOutletId() { return outletId; }
    public void setOutletId(Long outletId) { this.outletId = outletId; }

    public String getOrderType() { return orderType; }
    public void setOrderType(String orderType) { this.orderType = orderType; }

    public Long getTableId() { return tableId; }
    public void setTableId(Long tableId) { this.tableId = tableId; }

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public String getCustomerPhone() { return customerPhone; }
    public void setCustomerPhone(String customerPhone) { this.customerPhone = customerPhone; }

    public BigDecimal getDiscountAmount() { return discountAmount; }
    public void setDiscountAmount(BigDecimal discountAmount) { this.discountAmount = discountAmount; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public List<ItemRequest> getItems() { return items; }
    public void setItems(List<ItemRequest> items) { this.items = items; }

    public PaymentRequest getPayment() { return payment; }
    public void setPayment(PaymentRequest payment) { this.payment = payment; }

    public static class ItemRequest {
        private Long productId;
        private Long variantId;
        private Integer quantity = 1;
        private String notes;

        public ItemRequest() {}

        public Long getProductId() { return productId; }
        public void setProductId(Long productId) { this.productId = productId; }

        public Long getVariantId() { return variantId; }
        public void setVariantId(Long variantId) { this.variantId = variantId; }

        public Integer getQuantity() { return quantity; }
        public void setQuantity(Integer quantity) { this.quantity = quantity; }

        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }
    }

    public static class PaymentRequest {
        private String paymentMethod = "CASH";
        private BigDecimal amountPaid;
        private String referenceNumber;

        public PaymentRequest() {}

        public String getPaymentMethod() { return paymentMethod; }
        public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

        public BigDecimal getAmountPaid() { return amountPaid; }
        public void setAmountPaid(BigDecimal amountPaid) { this.amountPaid = amountPaid; }

        public String getReferenceNumber() { return referenceNumber; }
        public void setReferenceNumber(String referenceNumber) { this.referenceNumber = referenceNumber; }
    }
}
