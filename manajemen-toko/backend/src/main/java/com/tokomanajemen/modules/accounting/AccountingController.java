package com.tokomanajemen.modules.accounting;

import com.tokomanajemen.common.ApiResponse;
import com.tokomanajemen.modules.accounting.dto.FinancialReportResponse;
import com.tokomanajemen.modules.accounting.dto.GeneralLedgerResponse;
import com.tokomanajemen.modules.accounting.dto.ManualJournalRequest;
import com.tokomanajemen.modules.accounting.model.ChartOfAccount;
import com.tokomanajemen.modules.accounting.model.JournalEntry;
import com.tokomanajemen.modules.accounting.model.JournalLine;
import com.tokomanajemen.modules.accounting.repository.ChartOfAccountRepository;
import com.tokomanajemen.modules.accounting.repository.JournalEntryRepository;
import com.tokomanajemen.modules.accounting.repository.JournalLineRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;

@RestController
@RequestMapping("/api/v1/accounting")
public class AccountingController {

    private final ChartOfAccountRepository coaRepository;
    private final JournalEntryRepository entryRepository;
    private final JournalLineRepository lineRepository;

    public AccountingController(ChartOfAccountRepository coaRepository,
                                JournalEntryRepository entryRepository,
                                JournalLineRepository lineRepository) {
        this.coaRepository = coaRepository;
        this.entryRepository = entryRepository;
        this.lineRepository = lineRepository;
    }

    @GetMapping("/coa")
    public ResponseEntity<List<ChartOfAccount>> getAllCoa() {
        return ResponseEntity.ok(coaRepository.findByActiveTrueOrderByCodeAsc());
    }

    @GetMapping("/report")
    public ResponseEntity<Map<String, Object>> getAccountingReport() {
        List<JournalEntry> entries = entryRepository.findAllByOrderByEntryDateDesc();
        List<ChartOfAccount> coaList = coaRepository.findByActiveTrueOrderByCodeAsc();

        // Flatten entries to journal lines with entry metadata
        List<Map<String, Object>> flatLines = new ArrayList<>();
        Map<String, String> coaNameMap = new HashMap<>();
        for (ChartOfAccount c : coaList) {
            coaNameMap.put(c.getCode(), c.getName());
        }

        for (JournalEntry entry : entries) {
            for (JournalLine line : entry.getLines()) {
                Map<String, Object> item = new HashMap<>();
                item.put("id", line.getId());
                item.put("entryNo", entry.getEntryNo());
                item.put("date", entry.getEntryDate().toString());
                item.put("refType", entry.getReferenceType());
                item.put("refNo", entry.getReferenceId() != null ? entry.getReferenceId() : entry.getEntryNo());
                item.put("accountCode", line.getAccountCode());
                item.put("accountName", coaNameMap.getOrDefault(line.getAccountCode(), "Akun " + line.getAccountCode()));
                item.put("debit", line.getDebit());
                item.put("credit", line.getCredit());
                item.put("notes", line.getNotes() != null ? line.getNotes() : entry.getDescription());
                flatLines.add(item);
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("journal", flatLines);
        result.put("coa", coaList);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/general-ledger")
    public ResponseEntity<ApiResponse<GeneralLedgerResponse>> getGeneralLedger(@RequestParam String accountCode) {
        ChartOfAccount coa = coaRepository.findById(accountCode).orElse(null);
        if (coa == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Akun dengan kode " + accountCode + " tidak ditemukan"));
        }

        List<JournalLine> lines = lineRepository.findByAccountCodeOrderByJournalEntry_EntryDateAsc(accountCode);
        GeneralLedgerResponse response = new GeneralLedgerResponse();
        response.setAccountCode(coa.getCode());
        response.setAccountName(coa.getName());
        response.setNormalBalance(coa.getNormalBalance());

        BigDecimal runningBalance = BigDecimal.ZERO;
        List<GeneralLedgerResponse.LedgerItem> items = new ArrayList<>();

        for (JournalLine line : lines) {
            BigDecimal debit = line.getDebit();
            BigDecimal credit = line.getCredit();

            if ("DEBIT".equalsIgnoreCase(coa.getNormalBalance())) {
                runningBalance = runningBalance.add(debit).subtract(credit);
            } else {
                runningBalance = runningBalance.add(credit).subtract(debit);
            }

            JournalEntry entry = line.getJournalEntry();
            items.add(new GeneralLedgerResponse.LedgerItem(
                    entry != null ? entry.getEntryNo() : "-",
                    entry != null ? entry.getEntryDate() : Instant.now(),
                    line.getNotes() != null ? line.getNotes() : (entry != null ? entry.getDescription() : "-"),
                    debit,
                    credit,
                    runningBalance
            ));
        }

        response.setStartingBalance(BigDecimal.ZERO);
        response.setEndingBalance(runningBalance);
        response.setItems(items);

        return ResponseEntity.ok(ApiResponse.ok("Buku besar berhasil dihitung", response));
    }

    @GetMapping("/financial-report")
    public ResponseEntity<ApiResponse<FinancialReportResponse>> getFinancialReport() {
        List<JournalEntry> entries = entryRepository.findAllByOrderByEntryDateDesc();
        List<ChartOfAccount> coaList = coaRepository.findByActiveTrueOrderByCodeAsc();

        Map<String, BigDecimal> debitTotals = new HashMap<>();
        Map<String, BigDecimal> creditTotals = new HashMap<>();

        for (ChartOfAccount c : coaList) {
            debitTotals.put(c.getCode(), BigDecimal.ZERO);
            creditTotals.put(c.getCode(), BigDecimal.ZERO);
        }

        for (JournalEntry entry : entries) {
            for (JournalLine line : entry.getLines()) {
                String code = line.getAccountCode();
                debitTotals.put(code, debitTotals.getOrDefault(code, BigDecimal.ZERO).add(line.getDebit()));
                creditTotals.put(code, creditTotals.getOrDefault(code, BigDecimal.ZERO).add(line.getCredit()));
            }
        }

        // Hitung Saldo Akhir per Akun
        Map<String, BigDecimal> balances = new HashMap<>();
        for (ChartOfAccount c : coaList) {
            String code = c.getCode();
            BigDecimal deb = debitTotals.getOrDefault(code, BigDecimal.ZERO);
            BigDecimal cre = creditTotals.getOrDefault(code, BigDecimal.ZERO);
            if ("DEBIT".equalsIgnoreCase(c.getNormalBalance())) {
                balances.put(code, deb.subtract(cre));
            } else {
                balances.put(code, cre.subtract(deb));
            }
        }

        FinancialReportResponse report = new FinancialReportResponse();
        report.setAccountBalances(balances);

        // Laba Rugi
        BigDecimal revenue = balances.getOrDefault("4101", BigDecimal.ZERO);
        BigDecimal cogs = balances.getOrDefault("5101", BigDecimal.ZERO);
        BigDecimal opex = balances.getOrDefault("6101", BigDecimal.ZERO);
        BigDecimal grossProfit = revenue.subtract(cogs);
        BigDecimal netProfit = grossProfit.subtract(opex);

        report.setTotalRevenue(revenue);
        report.setTotalCogs(cogs);
        report.setGrossProfit(grossProfit);
        report.setOperationalExpense(opex);
        report.setNetProfit(netProfit);

        // Neraca
        BigDecimal kas = balances.getOrDefault("1101", BigDecimal.ZERO);
        BigDecimal bank = balances.getOrDefault("1102", BigDecimal.ZERO);
        BigDecimal piutang = balances.getOrDefault("1103", BigDecimal.ZERO);
        BigDecimal persediaan = balances.getOrDefault("1201", BigDecimal.ZERO);
        BigDecimal totalAssets = kas.add(bank).add(piutang).add(persediaan);

        BigDecimal utang = balances.getOrDefault("2101", BigDecimal.ZERO);
        BigDecimal modal = balances.getOrDefault("3101", BigDecimal.ZERO);
        BigDecimal labaDitahan = balances.getOrDefault("3201", BigDecimal.ZERO);
        BigDecimal totalEquity = modal.add(labaDitahan).add(netProfit);
        BigDecimal totalLiabAndEquity = utang.add(totalEquity);

        report.setTotalAssets(totalAssets);
        report.setTotalLiabilities(utang);
        report.setTotalEquity(totalEquity);

        BigDecimal diff = totalAssets.subtract(totalLiabAndEquity).abs();
        report.setBalanced(diff.compareTo(new BigDecimal("0.01")) <= 0);
        report.setBalanceDiff(diff);

        return ResponseEntity.ok(ApiResponse.ok("Laporan keuangan berhasil dihitung", report));
    }

    @PostMapping("/journal")
    @Transactional
    public ResponseEntity<ApiResponse<JournalEntry>> createManualJournal(@Valid @RequestBody ManualJournalRequest request) {
        BigDecimal totalDebit = BigDecimal.ZERO;
        BigDecimal totalCredit = BigDecimal.ZERO;

        for (ManualJournalRequest.LineItem item : request.getLines()) {
            if (item.getDebit() != null) totalDebit = totalDebit.add(item.getDebit());
            if (item.getCredit() != null) totalCredit = totalCredit.add(item.getCredit());
        }

        if (totalDebit.compareTo(BigDecimal.ZERO) <= 0) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Total nominal jurnal harus lebih dari 0"));
        }

        if (totalDebit.compareTo(totalCredit) != 0) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Jurnal tidak seimbang! Total Debet (Rp " + totalDebit +
                            ") harus sama dengan Total Kredit (Rp " + totalCredit + ")"));
        }

        String entryId = "JRN-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        JournalEntry entry = new JournalEntry(
                entryId,
                entryId,
                request.getReferenceType() != null ? request.getReferenceType() : "MANUAL",
                request.getReferenceId(),
                request.getDescription() != null ? request.getDescription() : "Jurnal Manual",
                "Admin"
        );

        for (ManualJournalRequest.LineItem item : request.getLines()) {
            JournalLine line = new JournalLine(
                    "JL-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(),
                    item.getAccountCode(),
                    item.getDebit(),
                    item.getCredit(),
                    item.getNotes()
            );
            entry.addLine(line);
        }

        JournalEntry saved = entryRepository.save(entry);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Jurnal umum berhasil dicatat", saved));
    }
}
