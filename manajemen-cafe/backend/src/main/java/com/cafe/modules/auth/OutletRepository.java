package com.cafe.modules.auth;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OutletRepository extends JpaRepository<Outlet, Long> {
    List<Outlet> findByTenantId(Long tenantId);
    Optional<Outlet> findByIdAndTenantId(Long id, Long tenantId);
}
