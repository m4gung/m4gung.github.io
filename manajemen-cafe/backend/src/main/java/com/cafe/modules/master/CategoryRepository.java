package com.cafe.modules.master;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    List<Category> findByTenantIdOrderBySortOrderAsc(Long tenantId);
    List<Category> findByTenantIdAndIsActiveTrueOrderBySortOrderAsc(Long tenantId);
    Optional<Category> findByIdAndTenantId(Long id, Long tenantId);
}
