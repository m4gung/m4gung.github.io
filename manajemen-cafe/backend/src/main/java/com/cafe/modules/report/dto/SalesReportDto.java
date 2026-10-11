package com.cafe.modules.report.dto;

import java.math.BigDecimal;
import java.util.Map;

public class SalesReportDto {
    private String startDate;
    private String endDate;
    private BigDecimal grossSales = BigDecimal.ZERO;
    private BigDecimal totalDiscount = BigDecimal.ZERO;
    private BigDecimal totalTax = BigDecimal.ZERO;
    private BigDecimal totalServiceCharge = BigDecimal.ZERO;
    private BigDecimal netSales = BigDecimal.ZERO;
    private long totalTransactions = 0;
    private BigDecimal averageOrderValue = BigDecimal.ZERO;
    private Map<String, BigDecimal> salesByPaymentMethod;

    public SalesReportDto() {}

    public String getStartDate() { return startDate; }
    public void setStartDate(String startDate) { this.startDate = startDate; }

    public String getEndDate() { return endDate; }
    public void setEndDate(String endDate) { this.endDate = endDate; }

    public BigDecimal getGrossSales() { return grossSales; }
    public void setGrossSales(BigDecimal grossSales) { this.grossSales = grossSales; }

    public BigDecimal getTotalDiscount() { return totalDiscount; }
    public void setTotalDiscount(BigDecimal totalDiscount) { this.totalDiscount = totalDiscount; }

    public BigDecimal getTotalTax() { return totalTax; }
    public void setTotalTax(BigDecimal totalTax) { this.totalTax = totalTax; }

    public BigDecimal getTotalServiceCharge() { return totalServiceCharge; }
    public void setTotalServiceCharge(BigDecimal totalServiceCharge) { this.totalServiceCharge = totalServiceCharge; }

    public BigDecimal getNetSales() { return netSales; }
    public void setNetSales(BigDecimal netSales) { this.netSales = netSales; }

    public long getTotalTransactions() { return totalTransactions; }
    public void setTotalTransactions(long totalTransactions) { this.totalTransactions = totalTransactions; }

    public BigDecimal getAverageOrderValue() { return averageOrderValue; }
    public void setAverageOrderValue(BigDecimal averageOrderValue) { this.averageOrderValue = averageOrderValue; }

    public Map<String, BigDecimal> getSalesByPaymentMethod() { return salesByPaymentMethod; }
    public void setSalesByPaymentMethod(Map<String, BigDecimal> salesByPaymentMethod) { this.salesByPaymentMethod = salesByPaymentMethod; }
}
