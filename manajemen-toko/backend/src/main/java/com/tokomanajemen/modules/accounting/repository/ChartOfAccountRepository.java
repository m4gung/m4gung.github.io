package com.tokomanajemen.modules.accounting.repository;

import com.tokomanajemen.modules.accounting.model.ChartOfAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChartOfAccountRepository extends JpaRepository<ChartOfAccount, String> {
    List<ChartOfAccount> findByActiveTrueOrderByCodeAsc();
}
