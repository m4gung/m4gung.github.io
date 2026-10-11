package com.cafe.modules.purchasing.dto;

import jakarta.validation.constraints.NotBlank;
import java.time.Instant;

public class SupplierDto {
    private Long id;

    @NotBlank(message = "Nama supplier wajib diisi")
    private String name;

    private String contactPerson;
    private String phone;
    private String email;
    private String address;
    private Boolean isActive = true;
    private Instant createdAt;

    public SupplierDto() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getContactPerson() { return contactPerson; }
    public void setContactPerson(String contactPerson) { this.contactPerson = contactPerson; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean active) { isActive = active; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
