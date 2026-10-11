package com.cafe.modules.master;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByTenantIdOrderByNameAsc(Long tenantId);
    List<Product> findByTenantIdAndIsActiveTrueOrderByNameAsc(Long tenantId);
    List<Product> findByTenantIdAndCategoryId(Long tenantId, Long categoryId);
    Optional<Product> findByIdAndTenantId(Long id, Long tenantId);
}
