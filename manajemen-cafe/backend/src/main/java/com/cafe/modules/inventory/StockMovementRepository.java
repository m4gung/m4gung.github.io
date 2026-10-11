package com.cafe.modules.inventory;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StockMovementRepository extends JpaRepository<StockMovement, Long> {
    List<StockMovement> findByTenantIdOrderByCreatedAtDesc(Long tenantId);
    List<StockMovement> findByTenantIdAndIngredientIdOrderByCreatedAtDesc(Long tenantId, Long ingredientId);
}
