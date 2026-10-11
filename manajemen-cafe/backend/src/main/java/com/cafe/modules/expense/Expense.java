package com.cafe.modules.expense;

import com.cafe.modules.auth.Outlet;
import com.cafe.modules.auth.Tenant;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "expenses")
public class Expense {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "outlet_id", nullable = false)
    private Outlet outlet;

    @Column(nullable = false, length = 100)
    private String category; // UTILITY, SALARY, RENT, MAINTENANCE, MARKETING, SUPPLIES, OTHER

    @Column(nullable = false, length = 255)
    private String description;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(name = "payment_method", length = 50)
    private String paymentMethod = "CASH";

    @Column(name = "expense_date")
    private Instant expenseDate = Instant.now();

    @Column(name = "receipt_ref", length = 100)
    private String receiptRef;

    @Column(name = "recorded_by", length = 100)
    private String recordedBy;

    @Column(name = "created_at")
    private Instant createdAt = Instant.now();

    public Expense() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Tenant getTenant() { return tenant; }
    public void setTenant(Tenant tenant) { this.tenant = tenant; }

    public Outlet getOutlet() { return outlet; }
    public void setOutlet(Outlet outlet) { this.outlet = outlet; }

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
