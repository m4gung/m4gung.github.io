package com.tokomanajemen.modules.pos.dto;

import java.math.BigDecimal;

public class AgingScheduleResponse {
    private BigDecimal totalOutstanding = BigDecimal.ZERO;
    private BigDecimal currentAmount = BigDecimal.ZERO;     // Belum jatuh tempo
    private BigDecimal days1To30 = BigDecimal.ZERO;         // Terlambat 1 - 30 hari
    private BigDecimal days31To60 = BigDecimal.ZERO;        // Terlambat 31 - 60 hari
    private BigDecimal daysOver60 = BigDecimal.ZERO;        // Terlambat > 60 hari

    private int totalInvoices = 0;
    private int currentInvoices = 0;
    private int days1To30Invoices = 0;
    private int days31To60Invoices = 0;
    private int daysOver60Invoices = 0;

    public AgingScheduleResponse() {}

    public BigDecimal getTotalOutstanding() { return totalOutstanding; }
    public void setTotalOutstanding(BigDecimal totalOutstanding) { this.totalOutstanding = totalOutstanding; }

    public BigDecimal getCurrentAmount() { return currentAmount; }
    public void setCurrentAmount(BigDecimal currentAmount) { this.currentAmount = currentAmount; }

    public BigDecimal getDays1To30() { return days1To30; }
    public void setDays1To30(BigDecimal days1To30) { this.days1To30 = days1To30; }

    public BigDecimal getDays31To60() { return days31To60; }
    public void setDays31To60(BigDecimal days31To60) { this.days31To60 = days31To60; }

    public BigDecimal getDaysOver60() { return daysOver60; }
    public void setDaysOver60(BigDecimal daysOver60) { this.daysOver60 = daysOver60; }

    public int getTotalInvoices() { return totalInvoices; }
    public void setTotalInvoices(int totalInvoices) { this.totalInvoices = totalInvoices; }

    public int getCurrentInvoices() { return currentInvoices; }
    public void setCurrentInvoices(int currentInvoices) { this.currentInvoices = currentInvoices; }

    public int getDays1To30Invoices() { return days1To30Invoices; }
    public void setDays1To30Invoices(int days1To30Invoices) { this.days1To30Invoices = days1To30Invoices; }

    public int getDays31To60Invoices() { return days31To60Invoices; }
    public void setDays31To60Invoices(int days31To60Invoices) { this.days31To60Invoices = days31To60Invoices; }

    public int getDaysOver60Invoices() { return daysOver60Invoices; }
    public void setDaysOver60Invoices(int daysOver60Invoices) { this.daysOver60Invoices = daysOver60Invoices; }
}
