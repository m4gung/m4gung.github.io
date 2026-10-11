package com.cafe.modules.expense;

import com.cafe.common.TenantContext;
import com.cafe.modules.auth.Outlet;
import com.cafe.modules.auth.OutletRepository;
import com.cafe.modules.auth.Tenant;
import com.cafe.modules.auth.TenantRepository;
import com.cafe.modules.expense.dto.ExpenseDto;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ExpenseServiceTest {

    @Mock
    private ExpenseRepository expenseRepository;

    @Mock
    private TenantRepository tenantRepository;

    @Mock
    private OutletRepository outletRepository;

    @InjectMocks
    private ExpenseService expenseService;

    private Tenant tenant;
    private Outlet outlet;

    @BeforeEach
    void setUp() {
        tenant = new Tenant("Kopi Senja", "kopisenja");
        tenant.setId(1L);

        outlet = new Outlet(tenant, "Cabang Pusat");
        outlet.setId(1L);

        TenantContext.setTenantId(1L);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void testCreateExpense() {
        when(tenantRepository.findById(1L)).thenReturn(Optional.of(tenant));
        when(outletRepository.findByIdAndTenantId(1L, 1L)).thenReturn(Optional.of(outlet));
        when(expenseRepository.save(any(Expense.class))).thenAnswer(inv -> {
            Expense e = inv.getArgument(0);
            e.setId(50L);
            return e;
        });

        ExpenseDto dto = new ExpenseDto();
        dto.setOutletId(1L);
        dto.setCategory("UTILITY");
        dto.setDescription("Tagihan Listrik PLN September");
        dto.setAmount(new BigDecimal("750000.00"));
        dto.setPaymentMethod("TRANSFER");
        dto.setRecordedBy("Barista Lead");

        ExpenseDto result = expenseService.createExpense(dto);

        assertNotNull(result);
        assertEquals("UTILITY", result.getCategory());
        assertEquals(new BigDecimal("750000.00"), result.getAmount());
        verify(expenseRepository, times(1)).save(any(Expense.class));
    }

    @Test
    void testGetExpenses() {
        when(tenantRepository.findById(1L)).thenReturn(Optional.of(tenant));

        Expense expense = new Expense();
        expense.setId(1L);
        expense.setTenant(tenant);
        expense.setOutlet(outlet);
        expense.setCategory("SALARY");
        expense.setDescription("Gaji Barista Paruh Waktu");
        expense.setAmount(new BigDecimal("1200000.00"));

        when(expenseRepository.findByTenantIdAndOutletIdOrderByExpenseDateDesc(1L, 1L))
                .thenReturn(List.of(expense));

        List<ExpenseDto> list = expenseService.getExpenses(1L);

        assertEquals(1, list.size());
        assertEquals("SALARY", list.get(0).getCategory());
    }
}
