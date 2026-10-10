package com.tokomanajemen.modules.pos.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class PayReceivableRequest {

    @NotNull(message = "Jumlah bayar wajib diisi")
    @DecimalMin(value = "0.01", message = "Jumlah bayar harus lebih dari 0")
    private BigDecimal amount;

    @NotBlank(message = "Metode pembayaran wajib diisi (CASH, QRIS, TRANSFER)")
    private String paymentMethod;

    private String notes;

    public PayReceivableRequest() {}

    public PayReceivableRequest(BigDecimal amount, String paymentMethod, String notes) {
        this.amount = amount;
        this.paymentMethod = paymentMethod;
        this.notes = notes;
    }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
