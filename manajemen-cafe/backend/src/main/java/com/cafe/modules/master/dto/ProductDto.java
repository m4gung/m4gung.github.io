package com.cafe.modules.master.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class ProductDto {
    private Long id;
    private Long categoryId;
    private String categoryName;

    @NotBlank(message = "Nama produk wajib diisi")
    private String name;

    private String code;
    private String description;
    private String imageUrl;

    @NotNull(message = "Harga dasar wajib diisi")
    private BigDecimal basePrice;

    private Boolean isActive = true;
    private List<ProductVariantDto> variants = new ArrayList<>();

    public ProductDto() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getCategoryId() { return categoryId; }
    public void setCategoryId(Long categoryId) { this.categoryId = categoryId; }

    public String getCategoryName() { return categoryName; }
    public void setCategoryName(String categoryName) { this.categoryName = categoryName; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public BigDecimal getBasePrice() { return basePrice; }
    public void setBasePrice(BigDecimal basePrice) { this.basePrice = basePrice; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }

    public List<ProductVariantDto> getVariants() { return variants; }
    public void setVariants(List<ProductVariantDto> variants) { this.variants = variants; }
}
