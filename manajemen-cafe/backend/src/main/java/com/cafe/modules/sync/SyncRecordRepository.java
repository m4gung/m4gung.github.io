package com.cafe.modules.sync;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SyncRecordRepository extends JpaRepository<SyncRecord, Long> {
    Optional<SyncRecord> findByClientSyncId(String clientSyncId);
    boolean existsByClientSyncId(String clientSyncId);
}
