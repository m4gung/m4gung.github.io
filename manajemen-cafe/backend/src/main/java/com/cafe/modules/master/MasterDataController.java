package com.cafe.modules.master;

import com.cafe.common.ApiResponse;
import com.cafe.modules.master.dto.*;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/master")
public class MasterDataController {

    private final MasterDataService masterDataService;

    public MasterDataController(MasterDataService masterDataService) {
        this.masterDataService = masterDataService;
    }

    // ================= CATEGORIES =================
    @GetMapping("/categories")
    public ResponseEntity<ApiResponse<List<CategoryDto>>> getCategories() {
        return ResponseEntity.ok(ApiResponse.success(masterDataService.getCategories(), "Daftar kategori berhasil dimuat"));
    }

    @PostMapping("/categories")
    public ResponseEntity<ApiResponse<CategoryDto>> saveCategory(@Valid @RequestBody CategoryDto dto) {
        return ResponseEntity.ok(ApiResponse.success(masterDataService.saveCategory(dto), "Kategori berhasil disimpan"));
    }

    @DeleteMapping("/categories/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(@PathVariable Long id) {
        masterDataService.deleteCategory(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Kategori berhasil dihapus"));
    }

    // ================= PRODUCTS =================
    @GetMapping("/products")
    public ResponseEntity<ApiResponse<List<ProductDto>>> getProducts() {
        return ResponseEntity.ok(ApiResponse.success(masterDataService.getProducts(), "Daftar produk berhasil dimuat"));
    }

    @PostMapping("/products")
    public ResponseEntity<ApiResponse<ProductDto>> saveProduct(@Valid @RequestBody ProductDto dto) {
        return ResponseEntity.ok(ApiResponse.success(masterDataService.saveProduct(dto), "Produk berhasil disimpan"));
    }

    @DeleteMapping("/products/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteProduct(@PathVariable Long id) {
        masterDataService.deleteProduct(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Produk berhasil dihapus"));
    }

    // ================= MODIFIERS =================
    @GetMapping("/modifiers")
    public ResponseEntity<ApiResponse<List<ModifierDto>>> getModifiers() {
        return ResponseEntity.ok(ApiResponse.success(masterDataService.getModifiers(), "Daftar modifier berhasil dimuat"));
    }

    @PostMapping("/modifiers")
    public ResponseEntity<ApiResponse<ModifierDto>> saveModifier(@Valid @RequestBody ModifierDto dto) {
        return ResponseEntity.ok(ApiResponse.success(masterDataService.saveModifier(dto), "Modifier berhasil disimpan"));
    }

    @DeleteMapping("/modifiers/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteModifier(@PathVariable Long id) {
        masterDataService.deleteModifier(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Modifier berhasil dihapus"));
    }

    // ================= TABLES =================
    @GetMapping("/tables")
    public ResponseEntity<ApiResponse<List<DiningTableDto>>> getTables(@RequestParam(required = false) Long outletId) {
        return ResponseEntity.ok(ApiResponse.success(masterDataService.getTables(outletId), "Daftar meja berhasil dimuat"));
    }

    @PostMapping("/tables")
    public ResponseEntity<ApiResponse<DiningTableDto>> saveTable(@Valid @RequestBody DiningTableDto dto) {
        return ResponseEntity.ok(ApiResponse.success(masterDataService.saveTable(dto), "Meja berhasil disimpan"));
    }

    @DeleteMapping("/tables/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTable(@PathVariable Long id, @RequestParam(required = false) Long outletId) {
        masterDataService.deleteTable(id, outletId);
        return ResponseEntity.ok(ApiResponse.success(null, "Meja berhasil dihapus"));
    }
}
