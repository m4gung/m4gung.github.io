package com.cafe.modules.audit;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findByTenantIdOrderByCreatedAtDesc(Long tenantId);
    Page<AuditLog> findByTenantIdOrderByCreatedAtDesc(Long tenantId, Pageable pageable);
    List<AuditLog> findByTenantIdAndActionOrderByCreatedAtDesc(Long tenantId, String action);
    List<AuditLog> findByTenantIdAndEntityTypeOrderByCreatedAtDesc(Long tenantId, String entityType);
}
