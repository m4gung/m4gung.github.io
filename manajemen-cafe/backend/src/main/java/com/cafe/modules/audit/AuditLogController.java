package com.cafe.modules.audit;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/audit-logs")
public class AuditLogController {

    private final AuditLogService auditLogService;

    public AuditLogController(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER', 'ADMIN')")
    public ResponseEntity<List<AuditLogDto>> getAuditLogs(
            @RequestParam(defaultValue = "1") Long tenantId,
            @RequestParam(defaultValue = "50") int limit,
            @RequestParam(required = false) String action
    ) {
        if (action != null && !action.isBlank()) {
            return ResponseEntity.ok(auditLogService.getAuditLogsByAction(tenantId, action));
        }
        return ResponseEntity.ok(auditLogService.getAuditLogs(tenantId, limit));
    }
}
