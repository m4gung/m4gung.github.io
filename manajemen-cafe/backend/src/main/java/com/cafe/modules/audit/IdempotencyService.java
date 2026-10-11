package com.cafe.modules.audit;

import com.cafe.modules.auth.Tenant;
import com.cafe.modules.auth.TenantRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

@Service
public class IdempotencyService {

    private final IdempotencyKeyRepository idempotencyKeyRepository;
    private final TenantRepository tenantRepository;

    public IdempotencyService(IdempotencyKeyRepository idempotencyKeyRepository,
                              TenantRepository tenantRepository) {
        this.idempotencyKeyRepository = idempotencyKeyRepository;
        this.tenantRepository = tenantRepository;
    }

    @Transactional(readOnly = true)
    public Optional<IdempotencyKey> findExistingKey(Long tenantId, String idempotencyKey) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            return Optional.empty();
        }
        return idempotencyKeyRepository.findByTenantIdAndIdempotencyKey(tenantId, idempotencyKey);
    }

    @Transactional
    public IdempotencyKey registerKey(Long tenantId, String idempotencyKey, String endpoint, String requestHash) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Tenant not found: " + tenantId));

        IdempotencyKey key = new IdempotencyKey();
        key.setTenant(tenant);
        key.setIdempotencyKey(idempotencyKey);
        key.setEndpoint(endpoint);
        key.setRequestHash(requestHash);
        key.setStatus("IN_PROGRESS");
        key.setCreatedAt(Instant.now());
        key.setExpiresAt(Instant.now().plus(24, ChronoUnit.HOURS)); // Expires after 24 hours

        return idempotencyKeyRepository.save(key);
    }

    @Transactional
    public void markCompleted(Long tenantId, String idempotencyKey, int responseCode, String responseBody) {
        idempotencyKeyRepository.findByTenantIdAndIdempotencyKey(tenantId, idempotencyKey)
                .ifPresent(key -> {
                    key.setStatus("COMPLETED");
                    key.setResponseCode(responseCode);
                    key.setResponseBody(responseBody);
                    idempotencyKeyRepository.save(key);
                });
    }

    @Transactional
    public void markFailed(Long tenantId, String idempotencyKey, int responseCode, String errorMessage) {
        idempotencyKeyRepository.findByTenantIdAndIdempotencyKey(tenantId, idempotencyKey)
                .ifPresent(key -> {
                    key.setStatus("FAILED");
                    key.setResponseCode(responseCode);
                    key.setResponseBody(errorMessage);
                    idempotencyKeyRepository.save(key);
                });
    }
}
