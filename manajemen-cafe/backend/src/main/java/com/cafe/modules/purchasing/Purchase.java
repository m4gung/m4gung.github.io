package com.cafe.modules.purchasing;

import com.cafe.modules.auth.Outlet;
import com.cafe.modules.auth.Tenant;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "purchases")
public class Purchase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "outlet_id", nullable = false)
    private Outlet outlet;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_id")
    private Supplier supplier;

    @Column(name = "invoice_number", nullable = false, length = 100)
    private String invoiceNumber;

    @Column(name = "purchase_date")
    private Instant purchaseDate = Instant.now();

    @Column(name = "total_amount", precision = 15, scale = 2)
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Column(name = "payment_status", length = 50)
    private String paymentStatus = "PAID"; // PAID, UNPAID, PARTIAL

    @Column(name = "payment_method", length = 50)
    private String paymentMethod = "CASH"; // CASH, TRANSFER, CREDIT

    @Column(length = 50)
    private String status = "RECEIVED"; // RECEIVED, DRAFT, CANCELLED

    @Column(columnDefinition = "TEXT")
    private String notes;

    @OneToMany(mappedBy = "purchase", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PurchaseItem> items = new ArrayList<>();

    @Column(name = "created_at")
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    private Instant updatedAt = Instant.now();

    public Purchase() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Tenant getTenant() { return tenant; }
    public void setTenant(Tenant tenant) { this.tenant = tenant; }

    public Outlet getOutlet() { return outlet; }
    public void setOutlet(Outlet outlet) { this.outlet = outlet; }

    public Supplier getSupplier() { return supplier; }
    public void setSupplier(Supplier supplier) { this.supplier = supplier; }

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

    public List<PurchaseItem> getItems() { return items; }
    public void setItems(List<PurchaseItem> items) { this.items = items; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
