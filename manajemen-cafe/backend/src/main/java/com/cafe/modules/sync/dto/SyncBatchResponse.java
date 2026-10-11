package com.cafe.modules.sync.dto;

import java.util.List;

public class SyncBatchResponse {
    private int totalReceived;
    private int totalProcessed;
    private List<String> acknowledgedSyncIds;

    public SyncBatchResponse() {}

    public SyncBatchResponse(int totalReceived, int totalProcessed, List<String> acknowledgedSyncIds) {
        this.totalReceived = totalReceived;
        this.totalProcessed = totalProcessed;
        this.acknowledgedSyncIds = acknowledgedSyncIds;
    }

    public int getTotalReceived() { return totalReceived; }
    public void setTotalReceived(int totalReceived) { this.totalReceived = totalReceived; }

    public int getTotalProcessed() { return totalProcessed; }
    public void setTotalProcessed(int totalProcessed) { this.totalProcessed = totalProcessed; }

    public List<String> getAcknowledgedSyncIds() { return acknowledgedSyncIds; }
    public void setAcknowledgedSyncIds(List<String> acknowledgedSyncIds) { this.acknowledgedSyncIds = acknowledgedSyncIds; }
}
