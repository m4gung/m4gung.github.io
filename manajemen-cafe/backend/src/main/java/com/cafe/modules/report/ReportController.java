package com.cafe.modules.report;

import com.cafe.common.ApiResponse;
import com.cafe.modules.report.dto.*;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;

@RestController
@RequestMapping("/reports")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<DashboardSummaryDto>> getDashboardSummary(@RequestParam(required = false) Long outletId) {
        return ResponseEntity.ok(ApiResponse.success(reportService.getDashboardSummary(outletId), "Ringkasan dashboard berhasil dimuat"));
    }

    @GetMapping("/sales")
    public ResponseEntity<ApiResponse<SalesReportDto>> getSalesReport(
            @RequestParam(required = false) Long outletId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant endDate) {
        return ResponseEntity.ok(ApiResponse.success(reportService.getSalesReport(outletId, startDate, endDate), "Laporan penjualan berhasil dimuat"));
    }

    @GetMapping("/profit-loss")
    public ResponseEntity<ApiResponse<ProfitLossReportDto>> getProfitLossReport(@RequestParam(required = false) Long outletId) {
        return ResponseEntity.ok(ApiResponse.success(reportService.getProfitLossReport(outletId), "Laporan laba rugi berhasil dimuat"));
    }
}
