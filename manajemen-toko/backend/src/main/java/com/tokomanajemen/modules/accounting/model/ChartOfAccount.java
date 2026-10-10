package com.tokomanajemen.modules.accounting.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;

@Entity
@Table(name = "chart_of_accounts")
public class ChartOfAccount {

    @Id
    @Column(length = 20)
    private String code;

    @NotBlank
    @Column(nullable = false, length = 150)
    private String name;

    @NotBlank
    @Column(nullable = false, length = 30)
    private String type; // ASET, KEWAJIBAN, EKUITAS, PENDAPATAN, BEBAN_HPP, BEBAN_OPERASIONAL

    @NotBlank
    @Column(name = "normal_balance", nullable = false, length = 10)
    private String normalBalance; // DEBIT, KREDIT

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    public ChartOfAccount() {}

    public ChartOfAccount(String code, String name, String type, String normalBalance) {
        this.code = code;
        this.name = name;
        this.type = type;
        this.normalBalance = normalBalance;
        this.active = true;
    }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getNormalBalance() { return normalBalance; }
    public void setNormalBalance(String normalBalance) { this.normalBalance = normalBalance; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
}
