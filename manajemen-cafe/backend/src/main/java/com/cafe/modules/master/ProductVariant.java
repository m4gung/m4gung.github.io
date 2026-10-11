package com.cafe.modules.master;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "product_variants")
public class ProductVariant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "price_adjustment", precision = 15, scale = 2)
    private BigDecimal priceAdjustment = BigDecimal.ZERO;

    @Column(name = "is_active")
    private Boolean isActive = true;

    public ProductVariant() {}

    public ProductVariant(Product product, String name, BigDecimal priceAdjustment) {
        this.product = product;
        this.name = name;
        this.priceAdjustment = priceAdjustment;
        this.isActive = true;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Product getProduct() { return product; }
    public void setProduct(Product product) { this.product = product; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public BigDecimal getPriceAdjustment() { return priceAdjustment; }
    public void setPriceAdjustment(BigDecimal priceAdjustment) { this.priceAdjustment = priceAdjustment; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
}
