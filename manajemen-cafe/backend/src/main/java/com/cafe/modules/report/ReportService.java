package com.cafe.modules.report;

import com.cafe.common.TenantContext;
import com.cafe.modules.auth.Tenant;
import com.cafe.modules.auth.TenantRepository;
import com.cafe.modules.expense.Expense;
import com.cafe.modules.expense.ExpenseRepository;
import com.cafe.modules.inventory.Ingredient;
import com.cafe.modules.inventory.IngredientRepository;
import com.cafe.modules.pos.Order;
import com.cafe.modules.pos.OrderItem;
import com.cafe.modules.pos.OrderRepository;
import com.cafe.modules.pos.Payment;
import com.cafe.modules.report.dto.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ReportService {

    private final OrderRepository orderRepository;
    private final ExpenseRepository expenseRepository;
    private final IngredientRepository ingredientRepository;
    private final TenantRepository tenantRepository;

    public ReportService(
            OrderRepository orderRepository,
            ExpenseRepository expenseRepository,
            IngredientRepository ingredientRepository,
            TenantRepository tenantRepository) {
        this.orderRepository = orderRepository;
        this.expenseRepository = expenseRepository;
        this.ingredientRepository = ingredientRepository;
        this.tenantRepository = tenantRepository;
    }

    private Tenant getRequiredCurrentTenant() {
        Long tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            throw new IllegalArgumentException("Tenant context tidak ditemukan");
        }
        return tenantRepository.findById(tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Tenant tidak ditemukan"));
    }

    @Transactional(readOnly = true)
    public DashboardSummaryDto getDashboardSummary(Long outletId) {
        Long tenantId = getRequiredCurrentTenant().getId();
        List<Order> orders = outletId != null
                ? orderRepository.findByTenantIdAndOutletIdOrderByCreatedAtDesc(tenantId, outletId)
                : orderRepository.findByTenantIdOrderByCreatedAtDesc(tenantId);

        List<Expense> expenses = outletId != null
                ? expenseRepository.findByTenantIdAndOutletIdOrderByExpenseDateDesc(tenantId, outletId)
                : expenseRepository.findByTenantIdOrderByExpenseDateDesc(tenantId);

        List<Ingredient> ingredients = ingredientRepository.findByTenantIdOrderByNameAsc(tenantId);

        LocalDate today = LocalDate.now();
        ZoneId zone = ZoneId.systemDefault();

        BigDecimal todayRevenue = BigDecimal.ZERO;
        long todayOrdersCount = 0;
        BigDecimal monthRevenue = BigDecimal.ZERO;
        BigDecimal monthExpense = BigDecimal.ZERO;

        Map<String, Long> productQuantityMap = new HashMap<>();
        Map<String, BigDecimal> productRevenueMap = new HashMap<>();

        for (Order order : orders) {
            if ("CANCELLED".equalsIgnoreCase(order.getStatus())) continue;

            LocalDate orderDate = order.getCreatedAt().atZone(zone).toLocalDate();

            if (orderDate.equals(today)) {
                todayRevenue = todayRevenue.add(order.getTotalAmount());
                todayOrdersCount++;
            }

            if (orderDate.getYear() == today.getYear() && orderDate.getMonth() == today.getMonth()) {
                monthRevenue = monthRevenue.add(order.getTotalAmount());
            }

            if (order.getItems() != null) {
                for (OrderItem item : order.getItems()) {
                    String name = item.getProductNameSnapshot();
                    long qty = item.getQuantity() != null ? item.getQuantity() : 0;
                    BigDecimal rev = item.getSubtotal() != null ? item.getSubtotal() : BigDecimal.ZERO;

                    productQuantityMap.put(name, productQuantityMap.getOrDefault(name, 0L) + qty);
                    productRevenueMap.put(name, productRevenueMap.getOrDefault(name, BigDecimal.ZERO).add(rev));
                }
            }
        }

        for (Expense expense : expenses) {
            LocalDate expDate = expense.getExpenseDate().atZone(zone).toLocalDate();
            if (expDate.getYear() == today.getYear() && expDate.getMonth() == today.getMonth()) {
                monthExpense = monthExpense.add(expense.getAmount());
            }
        }

        int lowStockCount = 0;
        for (Ingredient ing : ingredients) {
            if (ing.getCurrentStock().compareTo(ing.getMinimumStock()) <= 0) {
                lowStockCount++;
            }
        }

        List<DashboardSummaryDto.TopProductDto> topProducts = productQuantityMap.entrySet().stream()
                .sorted((a, b) -> Long.compare(b.getValue(), a.getValue()))
                .limit(5)
                .map(e -> new DashboardSummaryDto.TopProductDto(
                        e.getKey(),
                        e.getValue(),
                        productRevenueMap.getOrDefault(e.getKey(), BigDecimal.ZERO)
                ))
                .collect(Collectors.toList());

        DashboardSummaryDto dto = new DashboardSummaryDto();
        dto.setTodayRevenue(todayRevenue);
        dto.setTodayOrdersCount(todayOrdersCount);
        dto.setMonthRevenue(monthRevenue);
        dto.setMonthExpense(monthExpense);
        dto.setMonthNetProfit(monthRevenue.subtract(monthExpense));
        dto.setLowStockCount(lowStockCount);
        dto.setTopSellingProducts(topProducts);
        return dto;
    }

    @Transactional(readOnly = true)
    public SalesReportDto getSalesReport(Long outletId, Instant startDate, Instant endDate) {
        Long tenantId = getRequiredCurrentTenant().getId();
        List<Order> orders = outletId != null
                ? orderRepository.findByTenantIdAndOutletIdOrderByCreatedAtDesc(tenantId, outletId)
                : orderRepository.findByTenantIdOrderByCreatedAtDesc(tenantId);

        BigDecimal grossSales = BigDecimal.ZERO;
        BigDecimal totalDiscount = BigDecimal.ZERO;
        BigDecimal totalTax = BigDecimal.ZERO;
        BigDecimal totalServiceCharge = BigDecimal.ZERO;
        BigDecimal netSales = BigDecimal.ZERO;
        long totalTransactions = 0;
        Map<String, BigDecimal> paymentMap = new HashMap<>();

        for (Order order : orders) {
            if ("CANCELLED".equalsIgnoreCase(order.getStatus())) continue;
            if (startDate != null && order.getCreatedAt().isBefore(startDate)) continue;
            if (endDate != null && order.getCreatedAt().isAfter(endDate)) continue;

            grossSales = grossSales.add(order.getSubtotal());
            totalDiscount = totalDiscount.add(order.getDiscountAmount() != null ? order.getDiscountAmount() : BigDecimal.ZERO);
            totalTax = totalTax.add(order.getTaxAmount() != null ? order.getTaxAmount() : BigDecimal.ZERO);
            totalServiceCharge = totalServiceCharge.add(order.getServiceChargeAmount() != null ? order.getServiceChargeAmount() : BigDecimal.ZERO);
            netSales = netSales.add(order.getTotalAmount());
            totalTransactions++;

            if (order.getPayments() != null) {
                for (Payment p : order.getPayments()) {
                    String method = p.getPaymentMethod() != null ? p.getPaymentMethod() : "OTHER";
                    paymentMap.put(method, paymentMap.getOrDefault(method, BigDecimal.ZERO).add(p.getAmount()));
                }
            }
        }

        BigDecimal aov = totalTransactions > 0
                ? netSales.divide(BigDecimal.valueOf(totalTransactions), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        SalesReportDto dto = new SalesReportDto();
        dto.setGrossSales(grossSales);
        dto.setTotalDiscount(totalDiscount);
        dto.setTotalTax(totalTax);
        dto.setTotalServiceCharge(totalServiceCharge);
        dto.setNetSales(netSales);
        dto.setTotalTransactions(totalTransactions);
        dto.setAverageOrderValue(aov);
        dto.setSalesByPaymentMethod(paymentMap);
        return dto;
    }

    @Transactional(readOnly = true)
    public ProfitLossReportDto getProfitLossReport(Long outletId) {
        Long tenantId = getRequiredCurrentTenant().getId();
        List<Order> orders = outletId != null
                ? orderRepository.findByTenantIdAndOutletIdOrderByCreatedAtDesc(tenantId, outletId)
                : orderRepository.findByTenantIdOrderByCreatedAtDesc(tenantId);

        List<Expense> expenses = outletId != null
                ? expenseRepository.findByTenantIdAndOutletIdOrderByExpenseDateDesc(tenantId, outletId)
                : expenseRepository.findByTenantIdOrderByExpenseDateDesc(tenantId);

        BigDecimal revenue = BigDecimal.ZERO;
        for (Order order : orders) {
            if (!"CANCELLED".equalsIgnoreCase(order.getStatus())) {
                revenue = revenue.add(order.getTotalAmount());
            }
        }

        // Estimasi HPP / COGS (rata-rata 35% modal bahan baku kafe bila resep parsial)
        BigDecimal cogs = revenue.multiply(new BigDecimal("0.35")).setScale(2, RoundingMode.HALF_UP);
        BigDecimal grossProfit = revenue.subtract(cogs);
        BigDecimal grossMarginPct = revenue.compareTo(BigDecimal.ZERO) > 0
                ? grossProfit.divide(revenue, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)).setScale(1, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        BigDecimal totalExpenses = BigDecimal.ZERO;
        Map<String, BigDecimal> expensesByCategory = new HashMap<>();

        for (Expense expense : expenses) {
            totalExpenses = totalExpenses.add(expense.getAmount());
            String cat = expense.getCategory() != null ? expense.getCategory() : "OTHER";
            expensesByCategory.put(cat, expensesByCategory.getOrDefault(cat, BigDecimal.ZERO).add(expense.getAmount()));
        }

        BigDecimal netProfit = grossProfit.subtract(totalExpenses);
        BigDecimal netMarginPct = revenue.compareTo(BigDecimal.ZERO) > 0
                ? netProfit.divide(revenue, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)).setScale(1, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        ProfitLossReportDto dto = new ProfitLossReportDto();
        dto.setPeriod(LocalDate.now().getMonth().name() + " " + LocalDate.now().getYear());
        dto.setRevenue(revenue);
        dto.setCogs(cogs);
        dto.setGrossProfit(grossProfit);
        dto.setGrossMarginPercentage(grossMarginPct);
        dto.setTotalExpenses(totalExpenses);
        dto.setExpensesByCategory(expensesByCategory);
        dto.setNetProfit(netProfit);
        dto.setNetMarginPercentage(netMarginPct);
        return dto;
    }
}
