package com.cafe.modules.report.dto;

import java.math.BigDecimal;
import java.util.List;

public class DashboardSummaryDto {
    private BigDecimal todayRevenue = BigDecimal.ZERO;
    private long todayOrdersCount = 0;
    private BigDecimal monthRevenue = BigDecimal.ZERO;
    private BigDecimal monthExpense = BigDecimal.ZERO;
    private BigDecimal monthNetProfit = BigDecimal.ZERO;
    private int lowStockCount = 0;
    private List<TopProductDto> topSellingProducts;

    public DashboardSummaryDto() {}

    public BigDecimal getTodayRevenue() { return todayRevenue; }
    public void setTodayRevenue(BigDecimal todayRevenue) { this.todayRevenue = todayRevenue; }

    public long getTodayOrdersCount() { return todayOrdersCount; }
    public void setTodayOrdersCount(long todayOrdersCount) { this.todayOrdersCount = todayOrdersCount; }

    public BigDecimal getMonthRevenue() { return monthRevenue; }
    public void setMonthRevenue(BigDecimal monthRevenue) { this.monthRevenue = monthRevenue; }

    public BigDecimal getMonthExpense() { return monthExpense; }
    public void setMonthExpense(BigDecimal monthExpense) { this.monthExpense = monthExpense; }

    public BigDecimal getMonthNetProfit() { return monthNetProfit; }
    public void setMonthNetProfit(BigDecimal monthNetProfit) { this.monthNetProfit = monthNetProfit; }

    public int getLowStockCount() { return lowStockCount; }
    public void setLowStockCount(int lowStockCount) { this.lowStockCount = lowStockCount; }

    public List<TopProductDto> getTopSellingProducts() { return topSellingProducts; }
    public void setTopSellingProducts(List<TopProductDto> topSellingProducts) { this.topSellingProducts = topSellingProducts; }

    public static class TopProductDto {
        private String productName;
        private long quantitySold;
        private BigDecimal totalRevenue;

        public TopProductDto(String productName, long quantitySold, BigDecimal totalRevenue) {
            this.productName = productName;
            this.quantitySold = quantitySold;
            this.totalRevenue = totalRevenue;
        }

        public String getProductName() { return productName; }
        public long getQuantitySold() { return quantitySold; }
        public BigDecimal getTotalRevenue() { return totalRevenue; }
    }
}
