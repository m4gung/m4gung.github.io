package com.cafe.modules.auth.dto;

import java.util.List;

public class AuthResponse {
    private String token;
    private UserDto user;
    private TenantDto tenant;
    private List<OutletDto> outlets;

    public AuthResponse() {}

    public AuthResponse(String token, UserDto user, TenantDto tenant, List<OutletDto> outlets) {
        this.token = token;
        this.user = user;
        this.tenant = tenant;
        this.outlets = outlets;
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public UserDto getUser() { return user; }
    public void setUser(UserDto user) { this.user = user; }

    public TenantDto getTenant() { return tenant; }
    public void setTenant(TenantDto tenant) { this.tenant = tenant; }

    public List<OutletDto> getOutlets() { return outlets; }
    public void setOutlets(List<OutletDto> outlets) { this.outlets = outlets; }
}
