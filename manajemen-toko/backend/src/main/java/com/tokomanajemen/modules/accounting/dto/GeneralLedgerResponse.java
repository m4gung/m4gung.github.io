package com.tokomanajemen.modules.accounting.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public class GeneralLedgerResponse {

    private String accountCode;
    private String accountName;
    private String normalBalance;
    private BigDecimal startingBalance = BigDecimal.ZERO;
    private BigDecimal endingBalance = BigDecimal.ZERO;
    private List<LedgerItem> items;

    public static class LedgerItem {
        private String entryNo;
        private Instant date;
        private String description;
        private BigDecimal debit;
        private BigDecimal credit;
        private BigDecimal runningBalance;

        public LedgerItem() {}

        public LedgerItem(String entryNo, Instant date, String description, BigDecimal debit, BigDecimal credit, BigDecimal runningBalance) {
            this.entryNo = entryNo;
            this.date = date;
            this.description = description;
            this.debit = debit;
            this.credit = credit;
            this.runningBalance = runningBalance;
        }

        public String getEntryNo() { return entryNo; }
        public void setEntryNo(String entryNo) { this.entryNo = entryNo; }

        public Instant getDate() { return date; }
        public void setDate(Instant date) { this.date = date; }

        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }

        public BigDecimal getDebit() { return debit; }
        public void setDebit(BigDecimal debit) { this.debit = debit; }

        public BigDecimal getCredit() { return credit; }
        public void setCredit(BigDecimal credit) { this.credit = credit; }

        public BigDecimal getRunningBalance() { return runningBalance; }
        public void setRunningBalance(BigDecimal runningBalance) { this.runningBalance = runningBalance; }
    }

    public GeneralLedgerResponse() {}

    public String getAccountCode() { return accountCode; }
    public void setAccountCode(String accountCode) { this.accountCode = accountCode; }

    public String getAccountName() { return accountName; }
    public void setAccountName(String accountName) { this.accountName = accountName; }

    public String getNormalBalance() { return normalBalance; }
    public void setNormalBalance(String normalBalance) { this.normalBalance = normalBalance; }

    public BigDecimal getStartingBalance() { return startingBalance; }
    public void setStartingBalance(BigDecimal startingBalance) { this.startingBalance = startingBalance; }

    public BigDecimal getEndingBalance() { return endingBalance; }
    public void setEndingBalance(BigDecimal endingBalance) { this.endingBalance = endingBalance; }

    public List<LedgerItem> getItems() { return items; }
    public void setItems(List<LedgerItem> items) { this.items = items; }
}
