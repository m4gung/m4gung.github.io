package com.cafe.modules.master.dto;

import jakarta.validation.constraints.NotBlank;

public class DiningTableDto {
    private Long id;
    private Long outletId;

    @NotBlank(message = "Nomor atau nama meja wajib diisi")
    private String tableNumber;

    private Integer capacity = 4;
    private String status = "AVAILABLE"; // AVAILABLE, OCCUPIED, RESERVED

    public DiningTableDto() {}

    public DiningTableDto(Long id, Long outletId, String tableNumber, Integer capacity, String status) {
        this.id = id;
        this.outletId = outletId;
        this.tableNumber = tableNumber;
        this.capacity = capacity;
        this.status = status;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getOutletId() { return outletId; }
    public void setOutletId(Long outletId) { this.outletId = outletId; }

    public String getTableNumber() { return tableNumber; }
    public void setTableNumber(String tableNumber) { this.tableNumber = tableNumber; }

    public Integer getCapacity() { return capacity; }
    public void setCapacity(Integer capacity) { this.capacity = capacity; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
