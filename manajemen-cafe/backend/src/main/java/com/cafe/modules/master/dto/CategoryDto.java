package com.cafe.modules.master.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CategoryDto {
    private Long id;

    @NotBlank(message = "Nama kategori wajib diisi")
    @Size(max = 100)
    private String name;

    private Integer sortOrder = 0;
    private Boolean isActive = true;

    public CategoryDto() {}

    public CategoryDto(Long id, String name, Integer sortOrder, Boolean isActive) {
        this.id = id;
        this.name = name;
        this.sortOrder = sortOrder;
        this.isActive = isActive;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
}
