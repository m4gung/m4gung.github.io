package com.cafe.modules.audit;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;

@Repository
public interface IdempotencyKeyRepository extends JpaRepository<IdempotencyKey, Long> {
    Optional<IdempotencyKey> findByTenantIdAndIdempotencyKey(Long tenantId, String idempotencyKey);
    void deleteByExpiresAtBefore(Instant now);
}
