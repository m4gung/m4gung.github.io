package com.cafe.modules.master;

import com.cafe.modules.auth.Outlet;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "dining_tables")
public class DiningTable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "outlet_id", nullable = false)
    private Outlet outlet;

    @Column(name = "table_number", nullable = false, length = 50)
    private String tableNumber;

    private Integer capacity = 4;

    @Column(length = 30)
    private String status = "AVAILABLE"; // AVAILABLE, OCCUPIED, RESERVED

    @Column(name = "created_at")
    private Instant createdAt = Instant.now();

    public DiningTable() {}

    public DiningTable(Outlet outlet, String tableNumber, Integer capacity) {
        this.outlet = outlet;
        this.tableNumber = tableNumber;
        this.capacity = capacity;
        this.status = "AVAILABLE";
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Outlet getOutlet() { return outlet; }
    public void setOutlet(Outlet outlet) { this.outlet = outlet; }

    public String getTableNumber() { return tableNumber; }
    public void setTableNumber(String tableNumber) { this.tableNumber = tableNumber; }

    public Integer getCapacity() { return capacity; }
    public void setCapacity(Integer capacity) { this.capacity = capacity; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
