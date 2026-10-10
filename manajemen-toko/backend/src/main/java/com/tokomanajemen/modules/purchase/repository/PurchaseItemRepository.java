package com.tokomanajemen.modules.purchase.repository;

import com.tokomanajemen.modules.purchase.model.PurchaseItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PurchaseItemRepository extends JpaRepository<PurchaseItem, String> {
    List<PurchaseItem> findByPurchaseId(String purchaseId);
}
