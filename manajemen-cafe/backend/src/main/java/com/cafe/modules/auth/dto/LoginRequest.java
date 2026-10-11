package com.cafe.modules.auth.dto;

import jakarta.validation.constraints.NotBlank;

public class LoginRequest {

    private String tenantCode; // Opsional jika username unik atau jika login spesifik tenant

    @NotBlank(message = "Username wajib diisi")
    private String username;

    @NotBlank(message = "Password wajib diisi")
    private String password;

    public LoginRequest() {}

    public String getTenantCode() { return tenantCode; }
    public void setTenantCode(String tenantCode) { this.tenantCode = tenantCode; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}
