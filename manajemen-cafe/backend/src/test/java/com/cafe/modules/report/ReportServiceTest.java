package com.cafe.modules.report;

import com.cafe.common.TenantContext;
import com.cafe.modules.auth.Outlet;
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
import com.cafe.modules.report.dto.DashboardSummaryDto;
import com.cafe.modules.report.dto.ProfitLossReportDto;
import com.cafe.modules.report.dto.SalesReportDto;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReportServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private ExpenseRepository expenseRepository;

    @Mock
    private IngredientRepository ingredientRepository;

    @Mock
    private TenantRepository tenantRepository;

    @InjectMocks
    private ReportService reportService;

    private Tenant tenant;
    private Outlet outlet;
    private Order testOrder;
    private Expense testExpense;

    @BeforeEach
    void setUp() {
        tenant = new Tenant("Kopi Senja", "kopisenja");
        tenant.setId(1L);

        outlet = new Outlet(tenant, "Cabang Utama");
        outlet.setId(1L);

        testOrder = new Order();
        testOrder.setTenant(tenant);
        testOrder.setOutlet(outlet);
        testOrder.setOrderNumber("ORD-001");
        testOrder.setOrderType("DINE_IN");
        testOrder.setSubtotal(new BigDecimal("50000.00"));
        testOrder.setTotalAmount(new BigDecimal("55000.00"));
        testOrder.setStatus("PAID");

        OrderItem item = new OrderItem();
        item.setOrder(testOrder);
        item.setProductNameSnapshot("Kopi Susu");
        item.setUnitPriceSnapshot(new BigDecimal("25000.00"));
        item.setQuantity(2);
        item.setSubtotal(new BigDecimal("50000.00"));
        testOrder.getItems().add(item);

        Payment payment = new Payment();
        payment.setOrder(testOrder);
        payment.setPaymentMethod("QRIS");
        payment.setAmountPaid(new BigDecimal("55000.00"));
        payment.setStatus("PAID");
        testOrder.getPayments().add(payment);

        testExpense = new Expense();
        testExpense.setTenant(tenant);
        testExpense.setOutlet(outlet);
        testExpense.setCategory("UTILITY");
        testExpense.setDescription("Listrik");
        testExpense.setAmount(new BigDecimal("15000.00"));
        testExpense.setExpenseDate(Instant.now());

        TenantContext.setTenantId(1L);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void testGetDashboardSummary() {
        when(tenantRepository.findById(1L)).thenReturn(Optional.of(tenant));
        when(orderRepository.findByTenantIdOrderByCreatedAtDesc(1L)).thenReturn(List.of(testOrder));
        when(expenseRepository.findByTenantIdOrderByExpenseDateDesc(1L)).thenReturn(List.of(testExpense));

        Ingredient lowIngredient = new Ingredient(tenant, "Susu", "ml", new BigDecimal("20.00"), new BigDecimal("1000.00"), new BigDecimal("500.00"));
        when(ingredientRepository.findByTenantIdOrderByNameAsc(1L)).thenReturn(List.of(lowIngredient));

        DashboardSummaryDto result = reportService.getDashboardSummary(null);

        assertNotNull(result);
        assertEquals(0, new BigDecimal("55000.00").compareTo(result.getTodayRevenue()));
        assertEquals(1, result.getTodayOrdersCount());
        assertEquals(1, result.getLowStockCount());
        assertFalse(result.getTopSellingProducts().isEmpty());
        assertEquals("Kopi Susu", result.getTopSellingProducts().get(0).getProductName());
    }

    @Test
    void testGetSalesReport() {
        when(tenantRepository.findById(1L)).thenReturn(Optional.of(tenant));
        when(orderRepository.findByTenantIdOrderByCreatedAtDesc(1L)).thenReturn(List.of(testOrder));

        SalesReportDto result = reportService.getSalesReport(null, null, null);

        assertNotNull(result);
        assertEquals(1, result.getTotalTransactions());
        assertEquals(0, new BigDecimal("55000.00").compareTo(result.getNetSales()));
        assertEquals(0, new BigDecimal("55000.00").compareTo(result.getAverageOrderValue()));
        assertTrue(result.getSalesByPaymentMethod().containsKey("QRIS"));
    }

    @Test
    void testGetProfitLossReport() {
        when(tenantRepository.findById(1L)).thenReturn(Optional.of(tenant));
        when(orderRepository.findByTenantIdOrderByCreatedAtDesc(1L)).thenReturn(List.of(testOrder));
        when(expenseRepository.findByTenantIdOrderByExpenseDateDesc(1L)).thenReturn(List.of(testExpense));

        ProfitLossReportDto result = reportService.getProfitLossReport(null);

        assertNotNull(result);
        assertEquals(0, new BigDecimal("55000.00").compareTo(result.getRevenue()));
        assertEquals(0, new BigDecimal("15000.00").compareTo(result.getTotalExpenses()));
        assertTrue(result.getGrossProfit().compareTo(BigDecimal.ZERO) > 0);
    }
}
