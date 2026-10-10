package com.tokomanajemen.modules.product.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "products")
public class Product {

    @Id
    @Column(length = 36)
    private String id;

    @NotBlank(message = "SKU tidak boleh kosong")
    @Column(nullable = false, unique = true, length = 50)
    private String sku;

    @Column(length = 100)
    private String barcode;

    @NotBlank(message = "Nama produk tidak boleh kosong")
    @Column(nullable = false, length = 200)
    private String name;

    @Column(name = "category_name", length = 100)
    private String category = "Umum";

    @Column(length = 20, nullable = false)
    private String unit = "Pcs";

    @NotNull(message = "Harga beli harus diisi")
    @Min(value = 0, message = "Harga beli tidak boleh negatif")
    @Column(name = "cost_price", precision = 15, scale = 2, nullable = false)
    private BigDecimal costPrice = BigDecimal.ZERO;

    @NotNull(message = "Harga jual harus diisi")
    @Min(value = 0, message = "Harga jual tidak boleh negatif")
    @Column(name = "selling_price", precision = 15, scale = 2, nullable = false)
    private BigDecimal sellingPrice = BigDecimal.ZERO;

    @Min(value = 0, message = "Stok tidak boleh negatif")
    @Column(nullable = false)
    private int stock = 0;

    @Min(value = 0, message = "Batas stok minimum tidak boleh negatif")
    @Column(name = "min_stock", nullable = false)
    private int minStock = 5;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    private Instant updatedAt = Instant.now();

    public Product() {}

    public Product(String id, String sku, String barcode, String name, String category, String unit,
                   BigDecimal costPrice, BigDecimal sellingPrice, int stock, int minStock) {
        this.id = id;
        this.sku = sku;
        this.barcode = barcode;
        this.name = name;
        this.category = category;
        this.unit = unit;
        this.costPrice = costPrice;
        this.sellingPrice = sellingPrice;
        this.stock = stock;
        this.minStock = minStock;
        this.active = true;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getSku() {
        return sku;
    }

    public void setSku(String sku) {
        this.sku = sku;
    }

    public String getBarcode() {
        return barcode;
    }

    public void setBarcode(String barcode) {
        this.barcode = barcode;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public BigDecimal getCostPrice() {
        return costPrice;
    }

    public void setCostPrice(BigDecimal costPrice) {
        this.costPrice = costPrice;
    }

    public BigDecimal getSellingPrice() {
        return sellingPrice;
    }

    public void setSellingPrice(BigDecimal sellingPrice) {
        this.sellingPrice = sellingPrice;
    }

    public int getStock() {
        return stock;
    }

    public void setStock(int stock) {
        this.stock = stock;
    }

    public int getMinStock() {
        return minStock;
    }

    public void setMinStock(int minStock) {
        this.minStock = minStock;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
