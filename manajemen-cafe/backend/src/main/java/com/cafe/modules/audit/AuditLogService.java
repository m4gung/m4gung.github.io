package com.cafe.modules.audit;

import com.cafe.modules.auth.Tenant;
import com.cafe.modules.auth.TenantRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final TenantRepository tenantRepository;

    public AuditLogService(AuditLogRepository auditLogRepository, TenantRepository tenantRepository) {
        this.auditLogRepository = auditLogRepository;
        this.tenantRepository = tenantRepository;
    }

    @Transactional
    public AuditLog logAction(Long tenantId, Long userId, String username, String action,
                              String entityType, String entityId, String details, String ipAddress) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Tenant not found: " + tenantId));

        AuditLog log = new AuditLog();
        log.setTenant(tenant);
        log.setUserId(userId);
        log.setUsername(username != null ? username : "SYSTEM");
        log.setAction(action);
        log.setEntityType(entityType);
        log.setEntityId(entityId);
        log.setDetails(details);
        log.setIpAddress(ipAddress);
        log.setCreatedAt(Instant.now());

        return auditLogRepository.save(log);
    }

    @Transactional(readOnly = true)
    public List<AuditLogDto> getAuditLogs(Long tenantId, int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        Page<AuditLog> page = auditLogRepository.findByTenantIdOrderByCreatedAtDesc(tenantId, pageable);
        return page.getContent().stream()
                .map(AuditLogDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AuditLogDto> getAuditLogsByAction(Long tenantId, String action) {
        return auditLogRepository.findByTenantIdAndActionOrderByCreatedAtDesc(tenantId, action).stream()
                .map(AuditLogDto::fromEntity)
                .collect(Collectors.toList());
    }
}
