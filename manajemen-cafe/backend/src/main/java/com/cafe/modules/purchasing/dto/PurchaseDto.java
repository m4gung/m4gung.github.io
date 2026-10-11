package com.cafe.modules.purchasing.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

public class PurchaseDto {
    private Long id;

    @NotNull(message = "Outlet ID wajib diisi")
    private Long outletId;

    private Long supplierId;
    private String supplierName;

    @NotBlank(message = "Nomor faktur/nota pembelian wajib diisi")
    private String invoiceNumber;

    private Instant purchaseDate;
    private BigDecimal totalAmount;
    private String paymentStatus = "PAID"; // PAID, UNPAID, PARTIAL
    private String paymentMethod = "CASH"; // CASH, TRANSFER, CREDIT
    private String status = "RECEIVED";    // RECEIVED, DRAFT, CANCELLED
    private String notes;

    @NotEmpty(message = "Daftar item pembelian tidak boleh kosong")
    @Valid
    private List<PurchaseItemDto> items = new ArrayList<>();

    private Instant createdAt;

    public PurchaseDto() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getOutletId() { return outletId; }
    public void setOutletId(Long outletId) { this.outletId = outletId; }

    public Long getSupplierId() { return supplierId; }
    public void setSupplierId(Long supplierId) { this.supplierId = supplierId; }

    public String getSupplierName() { return supplierName; }
    public void setSupplierName(String supplierName) { this.supplierName = supplierName; }

    public String getInvoiceNumber() { return invoiceNumber; }
    public void setInvoiceNumber(String invoiceNumber) { this.invoiceNumber = invoiceNumber; }

    public Instant getPurchaseDate() { return purchaseDate; }
    public void setPurchaseDate(Instant purchaseDate) { this.purchaseDate = purchaseDate; }

    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }

    public String getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public List<PurchaseItemDto> getItems() { return items; }
    public void setItems(List<PurchaseItemDto> items) { this.items = items; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
