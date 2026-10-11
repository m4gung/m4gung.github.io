package com.cafe.modules.expense.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.Instant;

public class ExpenseDto {
    private Long id;

    @NotNull(message = "Outlet ID wajib diisi")
    private Long outletId;

    @NotBlank(message = "Kategori pengeluaran wajib diisi")
    private String category; // UTILITY, SALARY, RENT, MAINTENANCE, MARKETING, SUPPLIES, OTHER

    @NotBlank(message = "Keterangan pengeluaran wajib diisi")
    private String description;

    @NotNull(message = "Nominal pengeluaran wajib diisi")
    private BigDecimal amount;

    private String paymentMethod = "CASH";
    private Instant expenseDate;
    private String receiptRef;
    private String recordedBy;
    private Instant createdAt;

    public ExpenseDto() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getOutletId() { return outletId; }
    public void setOutletId(Long outletId) { this.outletId = outletId; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public Instant getExpenseDate() { return expenseDate; }
    public void setExpenseDate(Instant expenseDate) { this.expenseDate = expenseDate; }

    public String getReceiptRef() { return receiptRef; }
    public void setReceiptRef(String receiptRef) { this.receiptRef = receiptRef; }

    public String getRecordedBy() { return recordedBy; }
    public void setRecordedBy(String recordedBy) { this.recordedBy = recordedBy; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
