package com.cafe.modules.sync;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "sync_records")
public class SyncRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @Column(name = "outlet_id", nullable = false)
    private Long outletId;

    @Column(name = "client_sync_id", nullable = false, unique = true, length = 100)
    private String clientSyncId;

    @Column(name = "entity_type", nullable = false, length = 50)
    private String entityType;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String payload;

    @Column(length = 30)
    private String status = "SYNCED";

    @Column(name = "synced_at")
    private Instant syncedAt = Instant.now();

    public SyncRecord() {}

    public SyncRecord(Long tenantId, Long outletId, String clientSyncId, String entityType, String payload) {
        this.tenantId = tenantId;
        this.outletId = outletId;
        this.clientSyncId = clientSyncId;
        this.entityType = entityType;
        this.payload = payload;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getTenantId() { return tenantId; }
    public void setTenantId(Long tenantId) { this.tenantId = tenantId; }

    public Long getOutletId() { return outletId; }
    public void setOutletId(Long outletId) { this.outletId = outletId; }

    public String getClientSyncId() { return clientSyncId; }
    public void setClientSyncId(String clientSyncId) { this.clientSyncId = clientSyncId; }

    public String getEntityType() { return entityType; }
    public void setEntityType(String entityType) { this.entityType = entityType; }

    public String getPayload() { return payload; }
    public void setPayload(String payload) { this.payload = payload; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Instant getSyncedAt() { return syncedAt; }
    public void setSyncedAt(Instant syncedAt) { this.syncedAt = syncedAt; }
}
