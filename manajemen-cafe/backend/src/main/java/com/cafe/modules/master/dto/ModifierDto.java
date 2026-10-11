package com.cafe.modules.master.dto;

import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;

public class ModifierDto {
    private Long id;

    @NotBlank(message = "Nama modifier wajib diisi")
    private String name;

    private BigDecimal price = BigDecimal.ZERO;
    private Boolean isActive = true;

    public ModifierDto() {}

    public ModifierDto(Long id, String name, BigDecimal price, Boolean isActive) {
        this.id = id;
        this.name = name;
        this.price = price;
        this.isActive = isActive;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
}
