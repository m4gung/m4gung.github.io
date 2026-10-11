package com.cafe.modules.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class RegisterTenantRequest {

    @NotBlank(message = "Nama café wajib diisi")
    @Size(max = 150)
    private String tenantName;

    @NotBlank(message = "Kode café unik wajib diisi")
    @Size(min = 3, max = 50)
    private String tenantCode;

    @NotBlank(message = "Nama cabang/outlet awal wajib diisi")
    @Size(max = 150)
    private String outletName;

    @NotBlank(message = "Nama lengkap wajib diisi")
    private String fullName;

    @NotBlank(message = "Email wajib diisi")
    @Email(message = "Format email tidak valid")
    private String email;

    @NotBlank(message = "Username wajib diisi")
    @Size(min = 3, max = 50)
    private String username;

    @NotBlank(message = "Password wajib diisi")
    @Size(min = 6, message = "Password minimal 6 karakter")
    private String password;

    public RegisterTenantRequest() {}

    public String getTenantName() { return tenantName; }
    public void setTenantName(String tenantName) { this.tenantName = tenantName; }

    public String getTenantCode() { return tenantCode; }
    public void setTenantCode(String tenantCode) { this.tenantCode = tenantCode; }

    public String getOutletName() { return outletName; }
    public void setOutletName(String outletName) { this.outletName = outletName; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}
