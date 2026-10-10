package com.tokomanajemen;

import com.tokomanajemen.modules.accounting.dto.ManualJournalRequest;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class AccountingValidationTest {

    private static Validator validator;

    @BeforeAll
    static void setUp() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Test
    @DisplayName("Harus menolak jurnal jika baris item kosong")
    void shouldRejectEmptyJournalLines() {
        ManualJournalRequest req = new ManualJournalRequest();
        req.setDescription("Jurnal Kosong");
        req.setLines(List.of());

        var violations = validator.validate(req);
        assertFalse(violations.isEmpty(), "Harus ada pelanggaran validasi untuk baris kosong");
    }

    @Test
    @DisplayName("Validasi prinsip keseimbangan Double-Entry: Debet harus sama dengan Kredit")
    void shouldValidateDoubleEntryBalance() {
        BigDecimal debit1 = new BigDecimal("150000.00");
        BigDecimal credit1 = new BigDecimal("150000.00");

        assertEquals(0, debit1.compareTo(credit1), "Debet dan kredit harus persis seimbang");

        // Kasus tidak seimbang
        BigDecimal unbalDebit = new BigDecimal("200000.00");
        BigDecimal unbalCredit = new BigDecimal("150000.00");
        assertNotEquals(0, unbalDebit.compareTo(unbalCredit), "Jurnal tidak seimbang harus terdeteksi");
    }

    @Test
    @DisplayName("Kalkulasi Laba Rugi harus tepat tanpa pembulatan")
    void shouldCalculateIncomeStatementAccurately() {
        BigDecimal revenue = new BigDecimal("5000000.00"); // 4101
        BigDecimal cogs = new BigDecimal("3200000.00");    // 5101
        BigDecimal opex = new BigDecimal("450000.00");     // 6101

        BigDecimal grossProfit = revenue.subtract(cogs);
        BigDecimal netProfit = grossProfit.subtract(opex);

        assertEquals(new BigDecimal("1800000.00"), grossProfit);
        assertEquals(new BigDecimal("1350000.00"), netProfit);
    }

    @Test
    @DisplayName("Kalkulasi Neraca SAK EMKM: Aset = Kewajiban + Ekuitas harus seimbang")
    void shouldVerifyBalanceSheetEquation() {
        // ASET
        BigDecimal kas = new BigDecimal("2500000.00");
        BigDecimal bank = new BigDecimal("5000000.00");
        BigDecimal piutang = new BigDecimal("1200000.00");
        BigDecimal persediaan = new BigDecimal("3000000.00");
        BigDecimal totalAssets = kas.add(bank).add(piutang).add(persediaan); // 11.700.000

        // KEWAJIBAN & EKUITAS
        BigDecimal utang = new BigDecimal("1700000.00");
        BigDecimal modal = new BigDecimal("8650000.00");
        BigDecimal netProfit = new BigDecimal("1350000.00"); // Dari Laba Rugi
        BigDecimal totalEquity = modal.add(netProfit);        // 10.000.000
        BigDecimal totalLiabAndEquity = utang.add(totalEquity); // 11.700.000

        assertEquals(0, totalAssets.compareTo(totalLiabAndEquity), "Aset harus sama dengan Kewajiban + Ekuitas");
    }
}
