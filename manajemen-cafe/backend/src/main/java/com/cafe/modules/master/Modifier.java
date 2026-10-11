package com.cafe.modules.master;

import com.cafe.modules.auth.Tenant;
import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "modifiers")
public class Modifier {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(precision = 15, scale = 2)
    private BigDecimal price = BigDecimal.ZERO;

    @Column(name = "is_active")
    private Boolean isActive = true;

    public Modifier() {}

    public Modifier(Tenant tenant, String name, BigDecimal price) {
        this.tenant = tenant;
        this.name = name;
        this.price = price;
        this.isActive = true;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Tenant getTenant() { return tenant; }
    public void setTenant(Tenant tenant) { this.tenant = tenant; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
}
