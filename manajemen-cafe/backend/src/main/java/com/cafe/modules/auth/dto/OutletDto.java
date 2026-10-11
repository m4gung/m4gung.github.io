package com.cafe.modules.auth.dto;

import java.math.BigDecimal;

public class OutletDto {
    private Long id;
    private Long tenantId;
    private String name;
    private String address;
    private String phone;
    private String receiptHeader;
    private String receiptFooter;
    private BigDecimal taxPercentage;
    private BigDecimal serviceChargePercentage;
    private Boolean isActive;

    public OutletDto() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getTenantId() { return tenantId; }
    public void setTenantId(Long tenantId) { this.tenantId = tenantId; }

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
}
