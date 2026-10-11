package com.cafe.modules.master.dto;

import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;

public class ProductVariantDto {
    private Long id;

    @NotBlank(message = "Nama varian wajib diisi")
    private String name;

    private BigDecimal priceAdjustment = BigDecimal.ZERO;
    private Boolean isActive = true;

    public ProductVariantDto() {}

    public ProductVariantDto(Long id, String name, BigDecimal priceAdjustment, Boolean isActive) {
        this.id = id;
        this.name = name;
        this.priceAdjustment = priceAdjustment;
        this.isActive = isActive;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public BigDecimal getPriceAdjustment() { return priceAdjustment; }
    public void setPriceAdjustment(BigDecimal priceAdjustment) { this.priceAdjustment = priceAdjustment; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
}
