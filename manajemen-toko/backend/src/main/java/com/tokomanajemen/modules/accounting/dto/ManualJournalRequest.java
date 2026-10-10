package com.tokomanajemen.modules.accounting.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.List;

public class ManualJournalRequest {

    private String description;
    private String referenceType = "MANUAL";
    private String referenceId;

    @NotEmpty(message = "Baris jurnal debet-kredit tidak boleh kosong")
    private List<LineItem> lines;

    public static class LineItem {
        @NotNull(message = "Kode akun wajib diisi")
        private String accountCode;

        private BigDecimal debit = BigDecimal.ZERO;
        private BigDecimal credit = BigDecimal.ZERO;
        private String notes;

        public LineItem() {}

        public LineItem(String accountCode, BigDecimal debit, BigDecimal credit, String notes) {
            this.accountCode = accountCode;
            this.debit = debit != null ? debit : BigDecimal.ZERO;
            this.credit = credit != null ? credit : BigDecimal.ZERO;
            this.notes = notes;
        }

        public String getAccountCode() { return accountCode; }
        public void setAccountCode(String accountCode) { this.accountCode = accountCode; }

        public BigDecimal getDebit() { return debit; }
        public void setDebit(BigDecimal debit) { this.debit = debit; }

        public BigDecimal getCredit() { return credit; }
        public void setCredit(BigDecimal credit) { this.credit = credit; }

        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }
    }

    public ManualJournalRequest() {}

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getReferenceType() { return referenceType; }
    public void setReferenceType(String referenceType) { this.referenceType = referenceType; }

    public String getReferenceId() { return referenceId; }
    public void setReferenceId(String referenceId) { this.referenceId = referenceId; }

    public List<LineItem> getLines() { return lines; }
    public void setLines(List<LineItem> lines) { this.lines = lines; }
}
