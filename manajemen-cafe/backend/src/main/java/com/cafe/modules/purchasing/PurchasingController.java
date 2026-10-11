package com.cafe.modules.purchasing;

import com.cafe.common.ApiResponse;
import com.cafe.modules.purchasing.dto.PurchaseDto;
import com.cafe.modules.purchasing.dto.SupplierDto;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/purchasing")
public class PurchasingController {

    private final PurchasingService purchasingService;

    public PurchasingController(PurchasingService purchasingService) {
        this.purchasingService = purchasingService;
    }

    // ================= SUPPLIERS =================
    @GetMapping("/suppliers")
    public ResponseEntity<ApiResponse<List<SupplierDto>>> getSuppliers() {
        return ResponseEntity.ok(ApiResponse.success(purchasingService.getSuppliers(), "Daftar supplier berhasil dimuat"));
    }

    @PostMapping("/suppliers")
    public ResponseEntity<ApiResponse<SupplierDto>> saveSupplier(@Valid @RequestBody SupplierDto dto) {
        return ResponseEntity.ok(ApiResponse.success(purchasingService.saveSupplier(dto), "Data supplier berhasil disimpan"));
    }

    @DeleteMapping("/suppliers/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteSupplier(@PathVariable Long id) {
        purchasingService.deleteSupplier(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Supplier berhasil dihapus"));
    }

    // ================= PURCHASES =================
    @GetMapping("/purchases")
    public ResponseEntity<ApiResponse<List<PurchaseDto>>> getPurchases(@RequestParam(required = false) Long outletId) {
        return ResponseEntity.ok(ApiResponse.success(purchasingService.getPurchases(outletId), "Daftar pembelian bahan baku berhasil dimuat"));
    }

    @GetMapping("/purchases/{id}")
    public ResponseEntity<ApiResponse<PurchaseDto>> getPurchaseById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(purchasingService.getPurchaseById(id), "Detail pembelian berhasil dimuat"));
    }

    @PostMapping("/purchases")
    public ResponseEntity<ApiResponse<PurchaseDto>> createPurchase(@Valid @RequestBody PurchaseDto dto) {
        return ResponseEntity.ok(ApiResponse.success(purchasingService.createPurchase(dto), "Faktur pembelian berhasil dicatat & stok bertambah"));
    }
}
