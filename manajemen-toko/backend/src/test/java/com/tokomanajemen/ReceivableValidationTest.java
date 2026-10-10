package com.tokomanajemen;

import com.tokomanajemen.modules.pos.dto.AgingScheduleResponse;
import com.tokomanajemen.modules.pos.dto.PayReceivableRequest;
import com.tokomanajemen.modules.pos.model.Receivable;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class ReceivableValidationTest {

    private static Validator validator;

    @BeforeAll
    static void setUp() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Test
    @DisplayName("Harus menolak pembayaran piutang jika nominal <= 0 atau metode kosong")
    void shouldRejectInvalidPaymentRequest() {
        PayReceivableRequest req = new PayReceivableRequest(BigDecimal.ZERO, "", "Catatan");
        var violations = validator.validate(req);
        assertFalse(violations.isEmpty(), "Harus ada pelanggaran validasi untuk nominal 0 dan metode kosong");
    }

    @Test
    @DisplayName("Kalkulasi pelunasan piutang parsial harus akurat dengan BigDecimal")
    void shouldCalculatePartialPaymentAccurately() {
        BigDecimal totalAmount = new BigDecimal("1500000.00");
        BigDecimal initialPaid = BigDecimal.ZERO;
        BigDecimal payAmount = new BigDecimal("450000.00");

        BigDecimal newPaid = initialPaid.add(payAmount);
        BigDecimal newRemaining = totalAmount.subtract(newPaid);

        assertEquals(new BigDecimal("450000.00"), newPaid);
        assertEquals(new BigDecimal("1050000.00"), newRemaining);

        // Pelunasan sisa
        BigDecimal finalPayment = new BigDecimal("1050000.00");
        BigDecimal finalPaid = newPaid.add(finalPayment);
        BigDecimal finalRemaining = totalAmount.subtract(finalPaid);

        assertEquals(new BigDecimal("1500000.00"), finalPaid);
        assertEquals(0, BigDecimal.ZERO.compareTo(finalRemaining));
        assertEquals(new BigDecimal("0.00"), finalRemaining);
    }

    @Test
    @DisplayName("Logika klasifikasi Aging Schedule umur piutang harus tepat")
    void shouldClassifyAgingScheduleAccurately() {
        LocalDate today = LocalDate.now();

        // 1. Current (jatuh tempo 5 hari lagi)
        Receivable r1 = new Receivable("R1", "S1", "INV-1", "C1",
                new BigDecimal("500000.00"), BigDecimal.ZERO, new BigDecimal("500000.00"),
                today.plusDays(5), "ACTIVE");

        // 2. 1 - 30 hari (jatuh tempo 10 hari lalu)
        Receivable r2 = new Receivable("R2", "S2", "INV-2", "C2",
                new BigDecimal("300000.00"), BigDecimal.ZERO, new BigDecimal("300000.00"),
                today.minusDays(10), "OVERDUE");

        // 3. 31 - 60 hari (jatuh tempo 45 hari lalu)
        Receivable r3 = new Receivable("R3", "S3", "INV-3", "C3",
                new BigDecimal("200000.00"), BigDecimal.ZERO, new BigDecimal("200000.00"),
                today.minusDays(45), "OVERDUE");

        // 4. > 60 hari (jatuh tempo 90 hari lalu)
        Receivable r4 = new Receivable("R4", "S4", "INV-4", "C4",
                new BigDecimal("100000.00"), BigDecimal.ZERO, new BigDecimal("100000.00"),
                today.minusDays(90), "OVERDUE");

        List<Receivable> receivables = List.of(r1, r2, r3, r4);

        BigDecimal current = BigDecimal.ZERO;
        BigDecimal d1_30 = BigDecimal.ZERO;
        BigDecimal d31_60 = BigDecimal.ZERO;
        BigDecimal dOver60 = BigDecimal.ZERO;

        for (Receivable r : receivables) {
            BigDecimal rem = r.getRemainingAmount();
            if (!today.isAfter(r.getDueDate())) {
                current = current.add(rem);
            } else {
                long days = ChronoUnit.DAYS.between(r.getDueDate(), today);
                if (days <= 30) {
                    d1_30 = d1_30.add(rem);
                } else if (days <= 60) {
                    d31_60 = d31_60.add(rem);
                } else {
                    dOver60 = dOver60.add(rem);
                }
            }
        }

        assertEquals(new BigDecimal("500000.00"), current);
        assertEquals(new BigDecimal("300000.00"), d1_30);
        assertEquals(new BigDecimal("200000.00"), d31_60);
        assertEquals(new BigDecimal("100000.00"), dOver60);
    }
}
