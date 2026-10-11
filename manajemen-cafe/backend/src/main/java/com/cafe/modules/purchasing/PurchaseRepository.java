package com.cafe.modules.purchasing;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PurchaseRepository extends JpaRepository<Purchase, Long> {
    List<Purchase> findByTenantIdOrderByPurchaseDateDesc(Long tenantId);
    List<Purchase> findByTenantIdAndOutletIdOrderByPurchaseDateDesc(Long tenantId, Long outletId);
    Optional<Purchase> findByIdAndTenantId(Long id, Long tenantId);
}
