package com.cafe.modules.sync.dto;

import java.util.List;

public class SyncBatchRequest {

    private Long outletId;
    private List<SyncItemDto> items;

    public SyncBatchRequest() {}

    public Long getOutletId() { return outletId; }
    public void setOutletId(Long outletId) { this.outletId = outletId; }

    public List<SyncItemDto> getItems() { return items; }
    public void setItems(List<SyncItemDto> items) { this.items = items; }

    public static class SyncItemDto {
        private String clientSyncId;
        private String entityType; // ORDER, PAYMENT, EXPENSE
        private String action; // CREATE, UPDATE
        private String payload; // JSON string

        public SyncItemDto() {}

        public String getClientSyncId() { return clientSyncId; }
        public void setClientSyncId(String clientSyncId) { this.clientSyncId = clientSyncId; }

        public String getEntityType() { return entityType; }
        public void setEntityType(String entityType) { this.entityType = entityType; }

        public String getAction() { return action; }
        public void setAction(String action) { this.action = action; }

        public String getPayload() { return payload; }
        public void setPayload(String payload) { this.payload = payload; }
    }
}
