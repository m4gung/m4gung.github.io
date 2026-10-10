package com.tokomanajemen.modules.purchase.repository;

import com.tokomanajemen.modules.purchase.model.Purchase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PurchaseRepository extends JpaRepository<Purchase, String> {
    Optional<Purchase> findByPurchaseNo(String purchaseNo);
    List<Purchase> findAllByOrderByCreatedAtDesc();
    boolean existsByPurchaseNo(String purchaseNo);
}
