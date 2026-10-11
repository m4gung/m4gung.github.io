package com.cafe.modules.inventory;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RecipeRepository extends JpaRepository<Recipe, Long> {
    Optional<Recipe> findByProductIdAndTenantId(Long productId, Long tenantId);
    Optional<Recipe> findByProductId(Long productId);
    List<Recipe> findByTenantId(Long tenantId);
}
