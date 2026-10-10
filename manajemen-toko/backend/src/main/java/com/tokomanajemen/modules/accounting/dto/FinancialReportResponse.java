package com.tokomanajemen.modules.accounting.dto;

import java.math.BigDecimal;
import java.util.Map;

public class FinancialReportResponse {

    // Laba Rugi
    private BigDecimal totalRevenue = BigDecimal.ZERO;      // 4101
    private BigDecimal totalCogs = BigDecimal.ZERO;         // 5101
    private BigDecimal grossProfit = BigDecimal.ZERO;       // Revenue - Cogs
    private BigDecimal operationalExpense = BigDecimal.ZERO;// 6101
    private BigDecimal netProfit = BigDecimal.ZERO;         // GrossProfit - OperationalExpense

    // Neraca
    private BigDecimal totalAssets = BigDecimal.ZERO;       // Kas + Bank + Piutang + Persediaan
    private BigDecimal totalLiabilities = BigDecimal.ZERO;  // Utang Usaha
    private BigDecimal totalEquity = BigDecimal.ZERO;       // Modal + Laba Berjalan
    private boolean balanced = true;
    private BigDecimal balanceDiff = BigDecimal.ZERO;

    private Map<String, BigDecimal> accountBalances;

    public FinancialReportResponse() {}

    public BigDecimal getTotalRevenue() { return totalRevenue; }
    public void setTotalRevenue(BigDecimal totalRevenue) { this.totalRevenue = totalRevenue; }

    public BigDecimal getTotalCogs() { return totalCogs; }
    public void setTotalCogs(BigDecimal totalCogs) { this.totalCogs = totalCogs; }

    public BigDecimal getGrossProfit() { return grossProfit; }
    public void setGrossProfit(BigDecimal grossProfit) { this.grossProfit = grossProfit; }

    public BigDecimal getOperationalExpense() { return operationalExpense; }
    public void setOperationalExpense(BigDecimal operationalExpense) { this.operationalExpense = operationalExpense; }

    public BigDecimal getNetProfit() { return netProfit; }
    public void setNetProfit(BigDecimal netProfit) { this.netProfit = netProfit; }

    public BigDecimal getTotalAssets() { return totalAssets; }
    public void setTotalAssets(BigDecimal totalAssets) { this.totalAssets = totalAssets; }

    public BigDecimal getTotalLiabilities() { return totalLiabilities; }
    public void setTotalLiabilities(BigDecimal totalLiabilities) { this.totalLiabilities = totalLiabilities; }

    public BigDecimal getTotalEquity() { return totalEquity; }
    public void setTotalEquity(BigDecimal totalEquity) { this.totalEquity = totalEquity; }

    public boolean isBalanced() { return balanced; }
    public void setBalanced(boolean balanced) { this.balanced = balanced; }

    public BigDecimal getBalanceDiff() { return balanceDiff; }
    public void setBalanceDiff(BigDecimal balanceDiff) { this.balanceDiff = balanceDiff; }

    public Map<String, BigDecimal> getAccountBalances() { return accountBalances; }
    public void setAccountBalances(Map<String, BigDecimal> accountBalances) { this.accountBalances = accountBalances; }
}
