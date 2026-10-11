package com.cafe.modules.sync;

import com.cafe.common.ApiResponse;
import com.cafe.common.TenantContext;
import com.cafe.modules.sync.dto.SyncBatchRequest;
import com.cafe.modules.sync.dto.SyncBatchResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/sync")
public class SyncController {

    private final SyncRecordRepository syncRecordRepository;
    private final com.cafe.modules.audit.IdempotencyService idempotencyService;

    public SyncController(SyncRecordRepository syncRecordRepository,
                          com.cafe.modules.audit.IdempotencyService idempotencyService) {
        this.syncRecordRepository = syncRecordRepository;
        this.idempotencyService = idempotencyService;
    }

    @GetMapping("/health")
    public ResponseEntity<ApiResponse<String>> checkSyncHealth() {
        return ResponseEntity.ok(ApiResponse.success("ONLINE", "Backend Spring Boot aktif"));
    }

    @PostMapping("/batch")
    @Transactional
    public ResponseEntity<ApiResponse<SyncBatchResponse>> processSyncBatch(
            @RequestHeader(value = "X-Idempotency-Key", required = false) String idempotencyKey,
            @RequestBody SyncBatchRequest request) {
        Long tenantId = TenantContext.getTenantId();
        Long outletId = request.getOutletId() != null ? request.getOutletId() : TenantContext.getOutletId();

        if (tenantId == null) {
            return ResponseEntity.status(403).body(ApiResponse.error("Tenant ID tidak valid"));
        }
        if (outletId == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Outlet ID wajib disertakan"));
        }

        // 1. Idempotency Check
        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            java.util.Optional<com.cafe.modules.audit.IdempotencyKey> existing =
                    idempotencyService.findExistingKey(tenantId, idempotencyKey);
            if (existing.isPresent() && "COMPLETED".equals(existing.get().getStatus())) {
                // Return cached / acknowledged response directly
                List<String> cachedAckIds = new ArrayList<>();
                if (request.getItems() != null) {
                    for (SyncBatchRequest.SyncItemDto item : request.getItems()) {
                        if (item.getClientSyncId() != null) cachedAckIds.add(item.getClientSyncId());
                    }
                }
                SyncBatchResponse cachedResp = new SyncBatchResponse(cachedAckIds.size(), cachedAckIds.size(), cachedAckIds);
                return ResponseEntity.ok(ApiResponse.success(cachedResp, "Sinkronisasi batch telah diproses sebelumnya (Idempotent)"));
            } else if (existing.isEmpty()) {
                idempotencyService.registerKey(tenantId, idempotencyKey, "/sync/batch", "Items: " + (request.getItems() != null ? request.getItems().size() : 0));
            }
        }

        List<String> acknowledgedIds = new ArrayList<>();
        if (request.getItems() != null) {
            for (SyncBatchRequest.SyncItemDto item : request.getItems()) {
                String syncId = item.getClientSyncId();
                if (syncId == null || syncId.isBlank()) continue;

                if (!syncRecordRepository.existsByClientSyncId(syncId)) {
                    SyncRecord record = new SyncRecord(
                            tenantId,
                            outletId,
                            syncId,
                            item.getEntityType(),
                            item.getPayload()
                    );
                    syncRecordRepository.save(record);
                }
                acknowledgedIds.add(syncId);
            }
        }

        SyncBatchResponse response = new SyncBatchResponse(
                request.getItems() != null ? request.getItems().size() : 0,
                acknowledgedIds.size(),
                acknowledgedIds
        );

        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            idempotencyService.markCompleted(tenantId, idempotencyKey, 200, "Ack count: " + acknowledgedIds.size());
        }

        return ResponseEntity.ok(ApiResponse.success(response, "Sinkronisasi batch berhasil diproses"));
    }
}
