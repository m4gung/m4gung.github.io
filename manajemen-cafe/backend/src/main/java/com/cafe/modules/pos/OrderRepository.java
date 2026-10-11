package com.cafe.modules.pos;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByTenantIdOrderByCreatedAtDesc(Long tenantId);
    List<Order> findByTenantIdAndOutletIdOrderByCreatedAtDesc(Long tenantId, Long outletId);
    Optional<Order> findByIdAndTenantId(Long id, Long tenantId);
    Optional<Order> findByOrderNumberAndTenantId(String orderNumber, Long tenantId);
    long countByTenantIdAndOutletId(Long tenantId, Long outletId);
}
