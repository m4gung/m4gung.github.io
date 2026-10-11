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

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class IdempotencyServiceTest {

    @Mock
    private IdempotencyKeyRepository idempotencyKeyRepository;

    @Mock
    private TenantRepository tenantRepository;

    @InjectMocks
    private IdempotencyService idempotencyService;

    private Tenant tenant;

    @BeforeEach
    void setUp() {
        tenant = new Tenant();
        tenant.setId(1L);
        tenant.setName("Test Tenant");
    }

    @Test
    @DisplayName("Should register new idempotency key")
    void testRegisterKey() {
        when(tenantRepository.findById(1L)).thenReturn(Optional.of(tenant));
        when(idempotencyKeyRepository.save(any(IdempotencyKey.class))).thenAnswer(invocation -> invocation.getArgument(0));

        IdempotencyKey key = idempotencyService.registerKey(1L, "KEY-12345", "/sync/batch", "hash123");

        assertNotNull(key);
        assertEquals("KEY-12345", key.getIdempotencyKey());
        assertEquals("IN_PROGRESS", key.getStatus());
        assertEquals("/sync/batch", key.getEndpoint());
        verify(idempotencyKeyRepository, times(1)).save(any(IdempotencyKey.class));
    }

    @Test
    @DisplayName("Should mark idempotency key as completed")
    void testMarkCompleted() {
        IdempotencyKey key = new IdempotencyKey();
        key.setTenant(tenant);
        key.setIdempotencyKey("KEY-12345");
        key.setStatus("IN_PROGRESS");

        when(idempotencyKeyRepository.findByTenantIdAndIdempotencyKey(1L, "KEY-12345"))
                .thenReturn(Optional.of(key));

        idempotencyService.markCompleted(1L, "KEY-12345", 200, "{\"status\":\"ok\"}");

        assertEquals("COMPLETED", key.getStatus());
        assertEquals(200, key.getResponseCode());
        assertEquals("{\"status\":\"ok\"}", key.getResponseBody());
        verify(idempotencyKeyRepository, times(1)).save(key);
    }

    @Test
    @DisplayName("Should find existing key")
    void testFindExistingKey() {
        IdempotencyKey key = new IdempotencyKey();
        key.setIdempotencyKey("KEY-EXISTS");
        key.setStatus("COMPLETED");

        when(idempotencyKeyRepository.findByTenantIdAndIdempotencyKey(1L, "KEY-EXISTS"))
                .thenReturn(Optional.of(key));

        Optional<IdempotencyKey> result = idempotencyService.findExistingKey(1L, "KEY-EXISTS");

        assertTrue(result.isPresent());
        assertEquals("COMPLETED", result.get().getStatus());
    }
}
