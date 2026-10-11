package com.cafe.modules.expense;

import com.cafe.common.TenantContext;
import com.cafe.modules.auth.Outlet;
import com.cafe.modules.auth.OutletRepository;
import com.cafe.modules.auth.Tenant;
import com.cafe.modules.auth.TenantRepository;
import com.cafe.modules.expense.dto.ExpenseDto;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final TenantRepository tenantRepository;
    private final OutletRepository outletRepository;

    public ExpenseService(
            ExpenseRepository expenseRepository,
            TenantRepository tenantRepository,
            OutletRepository outletRepository) {
        this.expenseRepository = expenseRepository;
        this.tenantRepository = tenantRepository;
        this.outletRepository = outletRepository;
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
    public List<ExpenseDto> getExpenses(Long outletId) {
        Long tenantId = getRequiredCurrentTenant().getId();
        List<Expense> list;
        if (outletId != null) {
            list = expenseRepository.findByTenantIdAndOutletIdOrderByExpenseDateDesc(tenantId, outletId);
        } else {
            list = expenseRepository.findByTenantIdOrderByExpenseDateDesc(tenantId);
        }
        return list.stream().map(this::mapExpenseToDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ExpenseDto getExpenseById(Long id) {
        Long tenantId = getRequiredCurrentTenant().getId();
        Expense expense = expenseRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Pengeluaran tidak ditemukan"));
        return mapExpenseToDto(expense);
    }

    @Transactional
    public ExpenseDto createExpense(ExpenseDto dto) {
        Tenant tenant = getRequiredCurrentTenant();
        Outlet outlet = outletRepository.findByIdAndTenantId(dto.getOutletId(), tenant.getId())
                .orElseThrow(() -> new IllegalArgumentException("Outlet tidak ditemukan"));

        Expense expense = new Expense();
        expense.setTenant(tenant);
        expense.setOutlet(outlet);
        expense.setCategory(dto.getCategory());
        expense.setDescription(dto.getDescription());
        expense.setAmount(dto.getAmount());
        expense.setPaymentMethod(dto.getPaymentMethod() != null ? dto.getPaymentMethod() : "CASH");
        expense.setExpenseDate(dto.getExpenseDate() != null ? dto.getExpenseDate() : Instant.now());
        expense.setReceiptRef(dto.getReceiptRef());
        expense.setRecordedBy(dto.getRecordedBy() != null ? dto.getRecordedBy() : "Admin");

        Expense saved = expenseRepository.save(expense);
        return mapExpenseToDto(saved);
    }

    @Transactional
    public void deleteExpense(Long id) {
        Long tenantId = getRequiredCurrentTenant().getId();
        Expense expense = expenseRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Pengeluaran tidak ditemukan"));
        expenseRepository.delete(expense);
    }

    private ExpenseDto mapExpenseToDto(Expense expense) {
        ExpenseDto dto = new ExpenseDto();
        dto.setId(expense.getId());
        dto.setOutletId(expense.getOutlet().getId());
        dto.setCategory(expense.getCategory());
        dto.setDescription(expense.getDescription());
        dto.setAmount(expense.getAmount());
        dto.setPaymentMethod(expense.getPaymentMethod());
        dto.setExpenseDate(expense.getExpenseDate());
        dto.setReceiptRef(expense.getReceiptRef());
        dto.setRecordedBy(expense.getRecordedBy());
        dto.setCreatedAt(expense.getCreatedAt());
        return dto;
    }
}
