package com.cafe.modules.report.dto;

import java.math.BigDecimal;
import java.util.Map;

public class ProfitLossReportDto {
    private String period; // e.g., "October 2026"
    private BigDecimal revenue = BigDecimal.ZERO;          // Omzet Penjualan
    private BigDecimal cogs = BigDecimal.ZERO;             // Beban Pokok Penjualan (HPP Bahan)
    private BigDecimal grossProfit = BigDecimal.ZERO;      // Laba Kotor = Revenue - COGS
    private BigDecimal grossMarginPercentage = BigDecimal.ZERO; // (Gross Profit / Revenue) * 100
    private BigDecimal totalExpenses = BigDecimal.ZERO;    // Beban Operasional
    private Map<String, BigDecimal> expensesByCategory;    // Rincian per Kategori
    private BigDecimal netProfit = BigDecimal.ZERO;        // Laba Bersih = Gross Profit - Expenses
    private BigDecimal netMarginPercentage = BigDecimal.ZERO;   // (Net Profit / Revenue) * 100

    public ProfitLossReportDto() {}

    public String getPeriod() { return period; }
    public void setPeriod(String period) { this.period = period; }

    public BigDecimal getRevenue() { return revenue; }
    public void setRevenue(BigDecimal revenue) { this.revenue = revenue; }

    public BigDecimal getCogs() { return cogs; }
    public void setCogs(BigDecimal cogs) { this.cogs = cogs; }

    public BigDecimal getGrossProfit() { return grossProfit; }
    public void setGrossProfit(BigDecimal grossProfit) { this.grossProfit = grossProfit; }

    public BigDecimal getGrossMarginPercentage() { return grossMarginPercentage; }
    public void setGrossMarginPercentage(BigDecimal grossMarginPercentage) { this.grossMarginPercentage = grossMarginPercentage; }

    public BigDecimal getTotalExpenses() { return totalExpenses; }
    public void setTotalExpenses(BigDecimal totalExpenses) { this.totalExpenses = totalExpenses; }

    public Map<String, BigDecimal> getExpensesByCategory() { return expensesByCategory; }
    public void setExpensesByCategory(Map<String, BigDecimal> expensesByCategory) { this.expensesByCategory = expensesByCategory; }

    public BigDecimal getNetProfit() { return netProfit; }
    public void setNetProfit(BigDecimal netProfit) { this.netProfit = netProfit; }

    public BigDecimal getNetMarginPercentage() { return netMarginPercentage; }
    public void setNetMarginPercentage(BigDecimal netMarginPercentage) { this.netMarginPercentage = netMarginPercentage; }
}
