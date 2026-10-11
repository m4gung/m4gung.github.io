package com.cafe.modules.auth.dto;

public class UserDto {
    private Long id;
    private Long tenantId;
    private Long outletId;
    private String username;
    private String email;
    private String fullName;
    private String role;
    private Boolean isActive;

    public UserDto() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getTenantId() { return tenantId; }
    public void setTenantId(Long tenantId) { this.tenantId = tenantId; }

    public Long getOutletId() { return outletId; }
    public void setOutletId(Long outletId) { this.outletId = outletId; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
}
