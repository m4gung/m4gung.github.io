package com.tokomanajemen.modules.pos;

import com.tokomanajemen.common.ApiResponse;
import com.tokomanajemen.modules.pos.dto.AgingScheduleResponse;
import com.tokomanajemen.modules.pos.dto.PayReceivableRequest;
import com.tokomanajemen.modules.pos.model.Customer;
import com.tokomanajemen.modules.pos.model.Receivable;
import com.tokomanajemen.modules.pos.model.ReceivablePayment;
import com.tokomanajemen.modules.pos.repository.CustomerRepository;
import com.tokomanajemen.modules.pos.repository.ReceivablePaymentRepository;
import com.tokomanajemen.modules.pos.repository.ReceivableRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/receivables")
public class ReceivableController {

    private final ReceivableRepository receivableRepository;
    private final ReceivablePaymentRepository paymentRepository;
    private final CustomerRepository customerRepository;

    public ReceivableController(ReceivableRepository receivableRepository,
                                ReceivablePaymentRepository paymentRepository,
                                CustomerRepository customerRepository) {
        this.receivableRepository = receivableRepository;
        this.paymentRepository = paymentRepository;
        this.customerRepository = customerRepository;
    }

    @GetMapping
    public ResponseEntity<List<Receivable>> getAllReceivables() {
        LocalDate today = LocalDate.now();
        List<Receivable> list = receivableRepository.findAll();
        // Update overdue status dynamically if passed due date
        for (Receivable r : list) {
            if ("ACTIVE".equals(r.getStatus()) && today.isAfter(r.getDueDate())) {
                r.setStatus("OVERDUE");
                receivableRepository.save(r);
            }
        }
        return ResponseEntity.ok(list);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Receivable>> getReceivableById(@PathVariable String id) {
        return receivableRepository.findById(id)
                .map(r -> ResponseEntity.ok(ApiResponse.ok("Data piutang ditemukan", r)))
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("Piutang tidak ditemukan")));
    }

    @GetMapping("/aging")
    public ResponseEntity<ApiResponse<AgingScheduleResponse>> getAgingSchedule() {
        LocalDate today = LocalDate.now();
        List<Receivable> unpaidList = receivableRepository.findAll().stream()
                .filter(r -> !"PAID".equals(r.getStatus()) && r.getRemainingAmount().compareTo(BigDecimal.ZERO) > 0)
                .toList();

        AgingScheduleResponse response = new AgingScheduleResponse();
        BigDecimal total = BigDecimal.ZERO;
        BigDecimal current = BigDecimal.ZERO;
        BigDecimal d1_30 = BigDecimal.ZERO;
        BigDecimal d31_60 = BigDecimal.ZERO;
        BigDecimal dOver60 = BigDecimal.ZERO;

        int curCount = 0;
        int d1_30Count = 0;
        int d31_60Count = 0;
        int dOver60Count = 0;

        for (Receivable r : unpaidList) {
            BigDecimal remaining = r.getRemainingAmount();
            total = total.add(remaining);

            if (!today.isAfter(r.getDueDate())) {
                // Belum jatuh tempo / lancar
                current = current.add(remaining);
                curCount++;
            } else {
                long daysOverdue = ChronoUnit.DAYS.between(r.getDueDate(), today);
                if (daysOverdue <= 30) {
                    d1_30 = d1_30.add(remaining);
                    d1_30Count++;
                } else if (daysOverdue <= 60) {
                    d31_60 = d31_60.add(remaining);
                    d31_60Count++;
                } else {
                    dOver60 = dOver60.add(remaining);
                    dOver60Count++;
                }
            }
        }

        response.setTotalOutstanding(total);
        response.setCurrentAmount(current);
        response.setDays1To30(d1_30);
        response.setDays31To60(d31_60);
        response.setDaysOver60(dOver60);
        response.setTotalInvoices(unpaidList.size());
        response.setCurrentInvoices(curCount);
        response.setDays1To30Invoices(d1_30Count);
        response.setDays31To60Invoices(d31_60Count);
        response.setDaysOver60Invoices(dOver60Count);

        return ResponseEntity.ok(ApiResponse.ok("Analisis Aging Schedule berhasil dihitung", response));
    }

    @GetMapping("/{id}/payments")
    public ResponseEntity<List<ReceivablePayment>> getPayments(@PathVariable String id) {
        return ResponseEntity.ok(paymentRepository.findByReceivableIdOrderByPaymentDateDesc(id));
    }

    @PostMapping("/{id}/pay")
    @Transactional
    public ResponseEntity<ApiResponse<Receivable>> payReceivable(@PathVariable String id,
                                                                 @Valid @RequestBody PayReceivableRequest request) {
        Receivable rec = receivableRepository.findById(id).orElse(null);
        if (rec == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Faktur piutang tidak ditemukan"));
        }

        if ("PAID".equals(rec.getStatus()) || rec.getRemainingAmount().compareTo(BigDecimal.ZERO) <= 0) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Piutang ini sudah lunas"));
        }

        if (request.getAmount().compareTo(rec.getRemainingAmount()) > 0) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Jumlah pembayaran (Rp " + request.getAmount() +
                            ") melebihi sisa piutang (Rp " + rec.getRemainingAmount() + ")"));
        }

        // 1. Catat pembayaran
        ReceivablePayment payment = new ReceivablePayment(
                "PAY-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(),
                rec.getId(),
                request.getAmount(),
                request.getPaymentMethod(),
                request.getNotes() != null ? request.getNotes() : "Pembayaran Cicilan Piutang",
                "Kasir"
        );
        paymentRepository.save(payment);

        // 2. Update status & sisa piutang
        BigDecimal newPaid = rec.getPaidAmount().add(request.getAmount());
        BigDecimal newRemaining = rec.getRemainingAmount().subtract(request.getAmount());
        rec.setPaidAmount(newPaid);
        rec.setRemainingAmount(newRemaining);
        rec.setUpdatedAt(Instant.now());

        if (newRemaining.compareTo(BigDecimal.ZERO) <= 0) {
            rec.setStatus("PAID");
        } else if (LocalDate.now().isAfter(rec.getDueDate())) {
            rec.setStatus("OVERDUE");
        } else {
            rec.setStatus("ACTIVE");
        }
        receivableRepository.save(rec);

        // 3. Update saldo utang pelanggan
        Customer customer = customerRepository.findById(rec.getCustomerId()).orElse(null);
        if (customer != null) {
            BigDecimal updatedDebt = customer.getCurrentDebt().subtract(request.getAmount());
            if (updatedDebt.compareTo(BigDecimal.ZERO) < 0) {
                updatedDebt = BigDecimal.ZERO;
            }
            customer.setCurrentDebt(updatedDebt);
            customer.setUpdatedAt(Instant.now());
            customerRepository.save(customer);
        }

        return ResponseEntity.ok(ApiResponse.ok("Pembayaran cicilan piutang berhasil dicatat", rec));
    }
}
