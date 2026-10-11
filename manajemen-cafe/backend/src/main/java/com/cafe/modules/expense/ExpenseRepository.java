package com.cafe.modules.expense;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long> {
    List<Expense> findByTenantIdOrderByExpenseDateDesc(Long tenantId);
    List<Expense> findByTenantIdAndOutletIdOrderByExpenseDateDesc(Long tenantId, Long outletId);
    Optional<Expense> findByIdAndTenantId(Long id, Long tenantId);
}
