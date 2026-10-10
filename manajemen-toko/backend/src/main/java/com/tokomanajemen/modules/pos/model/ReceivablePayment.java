package com.tokomanajemen.modules.pos.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "receivable_payments")
public class ReceivablePayment {

    @Id
    private String id;

    @NotBlank
    @Column(name = "receivable_id", nullable = false)
    private String receivableId;

    @Column(name = "payment_date")
    private Instant paymentDate = Instant.now();

    @NotNull
    @DecimalMin(value = "0.01", message = "Jumlah pembayaran harus lebih dari 0")
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @NotBlank
    @Column(name = "payment_method", nullable = false, length = 30)
    private String paymentMethod; // CASH, QRIS, TRANSFER

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "received_by")
    private String receivedBy;

    public ReceivablePayment() {}

    public ReceivablePayment(String id, String receivableId, BigDecimal amount, String paymentMethod, String notes, String receivedBy) {
        this.id = id;
        this.receivableId = receivableId;
        this.paymentDate = Instant.now();
        this.amount = amount;
        this.paymentMethod = paymentMethod;
        this.notes = notes;
        this.receivedBy = receivedBy;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getReceivableId() { return receivableId; }
    public void setReceivableId(String receivableId) { this.receivableId = receivableId; }

    public Instant getPaymentDate() { return paymentDate; }
    public void setPaymentDate(Instant paymentDate) { this.paymentDate = paymentDate; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getReceivedBy() { return receivedBy; }
    public void setReceivedBy(String receivedBy) { this.receivedBy = receivedBy; }
}
