package com.tokomanajemen.modules.accounting.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "journal_entries")
public class JournalEntry {

    @Id
    private String id;

    @NotBlank
    @Column(name = "entry_no", unique = true, nullable = false, length = 50)
    private String entryNo;

    @Column(name = "entry_date", nullable = false)
    private Instant entryDate = Instant.now();

    @NotBlank
    @Column(name = "reference_type", nullable = false, length = 30)
    private String referenceType; // SALE, PURCHASE, EXPENSE, PAYMENT, MANUAL, COGS

    @Column(name = "reference_id", length = 100)
    private String referenceId;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "created_by", length = 36)
    private String createdBy;

    @Column(name = "created_at")
    private Instant createdAt = Instant.now();

    @OneToMany(mappedBy = "journalEntry", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<JournalLine> lines = new ArrayList<>();

    public JournalEntry() {}

    public JournalEntry(String id, String entryNo, String referenceType, String referenceId, String description, String createdBy) {
        this.id = id;
        this.entryNo = entryNo;
        this.entryDate = Instant.now();
        this.referenceType = referenceType;
        this.referenceId = referenceId;
        this.description = description;
        this.createdBy = createdBy;
        this.createdAt = Instant.now();
    }

    public void addLine(JournalLine line) {
        lines.add(line);
        line.setJournalEntry(this);
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getEntryNo() { return entryNo; }
    public void setEntryNo(String entryNo) { this.entryNo = entryNo; }

    public Instant getEntryDate() { return entryDate; }
    public void setEntryDate(Instant entryDate) { this.entryDate = entryDate; }

    public String getReferenceType() { return referenceType; }
    public void setReferenceType(String referenceType) { this.referenceType = referenceType; }

    public String getReferenceId() { return referenceId; }
    public void setReferenceId(String referenceId) { this.referenceId = referenceId; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public List<JournalLine> getLines() { return lines; }
    public void setLines(List<JournalLine> lines) { this.lines = lines; }
}
