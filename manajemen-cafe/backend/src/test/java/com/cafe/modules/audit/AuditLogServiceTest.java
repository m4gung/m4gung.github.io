package com.cafe.modules.audit;

import com.cafe.modules.auth.Tenant;
import com.cafe.modules.auth.TenantRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuditLogServiceTest {

    @Mock
    private AuditLogRepository auditLogRepository;

    @Mock
    private TenantRepository tenantRepository;

    @InjectMocks
    private AuditLogService auditLogService;

    private Tenant tenant;

    @BeforeEach
    void setUp() {
        tenant = new Tenant();
        tenant.setId(1L);
        tenant.setName("Test Tenant");
    }

    @Test
    @DisplayName("Should successfully record audit log")
    void testLogAction() {
        when(tenantRepository.findById(1L)).thenReturn(Optional.of(tenant));
        when(auditLogRepository.save(any(AuditLog.class))).thenAnswer(invocation -> {
            AuditLog log = invocation.getArgument(0);
            log.setId(100L);
            return log;
        });

        AuditLog log = auditLogService.logAction(
                1L, 2L, "kasir1", "ORDER_VOID", "ORDER", "CF-2026-001",
                "Alasan: pelanggan salah pesan", "127.0.0.1"
        );

        assertNotNull(log);
        assertEquals(100L, log.getId());
        assertEquals("ORDER_VOID", log.getAction());
        assertEquals("kasir1", log.getUsername());
        assertEquals("CF-2026-001", log.getEntityId());
        verify(auditLogRepository, times(1)).save(any(AuditLog.class));
    }

    @Test
    @DisplayName("Should retrieve recent audit logs")
    void testGetAuditLogs() {
        AuditLog log = new AuditLog();
        log.setId(1L);
        log.setTenant(tenant);
        log.setUserId(2L);
        log.setUsername("admin");
        log.setAction("STOCK_ADJUST");
        log.setEntityType("INGREDIENT");
        log.setEntityId("10");
        log.setDetails("Stok rusak -100g");
        log.setCreatedAt(Instant.now());

        Page<AuditLog> page = new PageImpl<>(List.of(log));
        when(auditLogRepository.findByTenantIdOrderByCreatedAtDesc(eq(1L), any(Pageable.class)))
                .thenReturn(page);

        List<AuditLogDto> dtos = auditLogService.getAuditLogs(1L, 20);

        assertNotNull(dtos);
        assertEquals(1, dtos.size());
        assertEquals("STOCK_ADJUST", dtos.get(0).getAction());
        assertEquals("admin", dtos.get(0).getUsername());
    }
}
