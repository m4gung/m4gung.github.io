package com.cafe.modules.pos.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public class OrderResponse {
    private Long id;
    private String orderNumber;
    private String orderType;
    private String tableName;
    private String customerName;
    private String customerPhone;
    private BigDecimal subtotal;
    private BigDecimal discountAmount;
    private BigDecimal taxAmount;
    private BigDecimal serviceChargeAmount;
    private BigDecimal totalAmount;
    private String status;
    private String notes;
    private List<OrderItemResponse> items;
    private PaymentInfo payment;
    private Instant createdAt;

    public OrderResponse() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getOrderNumber() { return orderNumber; }
    public void setOrderNumber(String orderNumber) { this.orderNumber = orderNumber; }

    public String getOrderType() { return orderType; }
    public void setOrderType(String orderType) { this.orderType = orderType; }

    public String getTableName() { return tableName; }
    public void setTableName(String tableName) { this.tableName = tableName; }

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public String getCustomerPhone() { return customerPhone; }
    public void setCustomerPhone(String customerPhone) { this.customerPhone = customerPhone; }

    public BigDecimal getSubtotal() { return subtotal; }
    public void setSubtotal(BigDecimal subtotal) { this.subtotal = subtotal; }

    public BigDecimal getDiscountAmount() { return discountAmount; }
    public void setDiscountAmount(BigDecimal discountAmount) { this.discountAmount = discountAmount; }

    public BigDecimal getTaxAmount() { return taxAmount; }
    public void setTaxAmount(BigDecimal taxAmount) { this.taxAmount = taxAmount; }

    public BigDecimal getServiceChargeAmount() { return serviceChargeAmount; }
    public void setServiceChargeAmount(BigDecimal serviceChargeAmount) { this.serviceChargeAmount = serviceChargeAmount; }

    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public List<OrderItemResponse> getItems() { return items; }
    public void setItems(List<OrderItemResponse> items) { this.items = items; }

    public PaymentInfo getPayment() { return payment; }
    public void setPayment(PaymentInfo payment) { this.payment = payment; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public static class OrderItemResponse {
        private Long id;
        private Long productId;
        private String productName;
        private String variantName;
        private BigDecimal unitPrice;
        private Integer quantity;
        private BigDecimal subtotal;
        private String notes;

        public OrderItemResponse() {}

        public OrderItemResponse(Long id, Long productId, String productName, String variantName, BigDecimal unitPrice, Integer quantity, BigDecimal subtotal, String notes) {
            this.id = id;
            this.productId = productId;
            this.productName = productName;
            this.variantName = variantName;
            this.unitPrice = unitPrice;
            this.quantity = quantity;
            this.subtotal = subtotal;
            this.notes = notes;
        }

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }

        public Long getProductId() { return productId; }
        public void setProductId(Long productId) { this.productId = productId; }

        public String getProductName() { return productName; }
        public void setProductName(String productName) { this.productName = productName; }

        public String getVariantName() { return variantName; }
        public void setVariantName(String variantName) { this.variantName = variantName; }

        public BigDecimal getUnitPrice() { return unitPrice; }
        public void setUnitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; }

        public Integer getQuantity() { return quantity; }
        public void setQuantity(Integer quantity) { this.quantity = quantity; }

        public BigDecimal getSubtotal() { return subtotal; }
        public void setSubtotal(BigDecimal subtotal) { this.subtotal = subtotal; }

        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }
    }

    public static class PaymentInfo {
        private String paymentMethod;
        private BigDecimal amountPaid;
        private BigDecimal changeAmount;
        private String status;
        private Instant paidAt;

        public PaymentInfo() {}

        public PaymentInfo(String paymentMethod, BigDecimal amountPaid, BigDecimal changeAmount, String status, Instant paidAt) {
            this.paymentMethod = paymentMethod;
            this.amountPaid = amountPaid;
            this.changeAmount = changeAmount;
            this.status = status;
            this.paidAt = paidAt;
        }

        public String getPaymentMethod() { return paymentMethod; }
        public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

        public BigDecimal getAmountPaid() { return amountPaid; }
        public void setAmountPaid(BigDecimal amountPaid) { this.amountPaid = amountPaid; }

        public BigDecimal getChangeAmount() { return changeAmount; }
        public void setChangeAmount(BigDecimal changeAmount) { this.changeAmount = changeAmount; }

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }

        public Instant getPaidAt() { return paidAt; }
        public void setPaidAt(Instant paidAt) { this.paidAt = paidAt; }
    }
}
