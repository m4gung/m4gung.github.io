package com.cafe.modules.auth.dto;

public class TenantDto {
    private Long id;
    private String name;
    private String code;
    private String plan;
    private String status;

    public TenantDto() {}

    public TenantDto(Long id, String name, String code, String plan, String status) {
        this.id = id;
        this.name = name;
        this.code = code;
        this.plan = plan;
        this.status = status;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getPlan() { return plan; }
    public void setPlan(String plan) { this.plan = plan; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
