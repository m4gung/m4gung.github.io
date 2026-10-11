package com.cafe.modules.inventory;

import com.cafe.common.ApiResponse;
import com.cafe.modules.inventory.dto.*;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/inventory")
public class InventoryController {

    private final InventoryService inventoryService;

    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    // ================= INGREDIENTS =================
    @GetMapping("/ingredients")
    public ResponseEntity<ApiResponse<List<IngredientDto>>> getIngredients() {
        return ResponseEntity.ok(ApiResponse.success(inventoryService.getIngredients(), "Daftar bahan baku berhasil dimuat"));
    }

    @PostMapping("/ingredients")
    public ResponseEntity<ApiResponse<IngredientDto>> saveIngredient(@Valid @RequestBody IngredientDto dto) {
        return ResponseEntity.ok(ApiResponse.success(inventoryService.saveIngredient(dto), "Bahan baku berhasil disimpan"));
    }

    @DeleteMapping("/ingredients/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteIngredient(@PathVariable Long id) {
        inventoryService.deleteIngredient(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Bahan baku berhasil dihapus"));
    }

    // ================= RECIPES (BOM) =================
    @GetMapping("/recipes")
    public ResponseEntity<ApiResponse<List<RecipeDto>>> getRecipes() {
        return ResponseEntity.ok(ApiResponse.success(inventoryService.getRecipes(), "Daftar resep berhasil dimuat"));
    }

    @GetMapping("/recipes/product/{productId}")
    public ResponseEntity<ApiResponse<RecipeDto>> getRecipeByProduct(@PathVariable Long productId) {
        return inventoryService.getRecipeByProductId(productId)
                .map(r -> ResponseEntity.ok(ApiResponse.success(r, "Resep produk berhasil dimuat")))
                .orElse(ResponseEntity.ok(ApiResponse.success(null, "Belum ada resep untuk produk ini")));
    }

    @PostMapping("/recipes")
    public ResponseEntity<ApiResponse<RecipeDto>> saveRecipe(@Valid @RequestBody RecipeDto dto) {
        return ResponseEntity.ok(ApiResponse.success(inventoryService.saveRecipe(dto), "Resep berhasil disimpan"));
    }

    // ================= STOCK ADJUSTMENT & MOVEMENTS =================
    @PostMapping("/adjust")
    public ResponseEntity<ApiResponse<StockMovementDto>> adjustStock(@Valid @RequestBody StockAdjustmentRequest request) {
        StockMovementDto result = inventoryService.adjustStock(request);
        return ResponseEntity.ok(ApiResponse.success(result, "Penyesuaian stok berhasil dicatat"));
    }

    @GetMapping("/movements")
    public ResponseEntity<ApiResponse<List<StockMovementDto>>> getMovements(@RequestParam(required = false) Long ingredientId) {
        return ResponseEntity.ok(ApiResponse.success(inventoryService.getStockMovements(ingredientId), "Riwayat mutasi stok berhasil dimuat"));
    }
}
