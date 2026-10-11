package com.cafe.modules.auth;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "outlets")
public class Outlet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String address;

    @Column(length = 50)
    private String phone;

    @Column(name = "receipt_header", columnDefinition = "TEXT")
    private String receiptHeader;

    @Column(name = "receipt_footer", columnDefinition = "TEXT")
    private String receiptFooter;

    @Column(name = "tax_percentage", precision = 5, scale = 2)
    private BigDecimal taxPercentage = BigDecimal.ZERO;

    @Column(name = "service_charge_percentage", precision = 5, scale = 2)
    private BigDecimal serviceChargePercentage = BigDecimal.ZERO;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "created_at")
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    private Instant updatedAt = Instant.now();

    public Outlet() {}

    public Outlet(Tenant tenant, String name) {
        this.tenant = tenant;
        this.name = name;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Tenant getTenant() { return tenant; }
    public void setTenant(Tenant tenant) { this.tenant = tenant; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getReceiptHeader() { return receiptHeader; }
    public void setReceiptHeader(String receiptHeader) { this.receiptHeader = receiptHeader; }

    public String getReceiptFooter() { return receiptFooter; }
    public void setReceiptFooter(String receiptFooter) { this.receiptFooter = receiptFooter; }

    public BigDecimal getTaxPercentage() { return taxPercentage; }
    public void setTaxPercentage(BigDecimal taxPercentage) { this.taxPercentage = taxPercentage; }

    public BigDecimal getServiceChargePercentage() { return serviceChargePercentage; }
    public void setServiceChargePercentage(BigDecimal serviceChargePercentage) { this.serviceChargePercentage = serviceChargePercentage; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
