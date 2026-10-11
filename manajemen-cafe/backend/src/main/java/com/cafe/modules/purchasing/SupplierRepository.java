package com.cafe.modules.purchasing;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SupplierRepository extends JpaRepository<Supplier, Long> {
    List<Supplier> findByTenantIdOrderByNameAsc(Long tenantId);
    Optional<Supplier> findByIdAndTenantId(Long id, Long tenantId);
}
