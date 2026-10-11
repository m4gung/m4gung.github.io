package com.cafe.modules.expense;

import com.cafe.common.ApiResponse;
import com.cafe.modules.expense.dto.ExpenseDto;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/expenses")
public class ExpenseController {

    private final ExpenseService expenseService;

    public ExpenseController(ExpenseService expenseService) {
        this.expenseService = expenseService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ExpenseDto>>> getExpenses(@RequestParam(required = false) Long outletId) {
        return ResponseEntity.ok(ApiResponse.success(expenseService.getExpenses(outletId), "Daftar pengeluaran operasional berhasil dimuat"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ExpenseDto>> getExpenseById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(expenseService.getExpenseById(id), "Detail pengeluaran berhasil dimuat"));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ExpenseDto>> createExpense(@Valid @RequestBody ExpenseDto dto) {
        return ResponseEntity.ok(ApiResponse.success(expenseService.createExpense(dto), "Pengeluaran operasional berhasil dicatat"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteExpense(@PathVariable Long id) {
        expenseService.deleteExpense(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Pengeluaran berhasil dihapus"));
    }
}
