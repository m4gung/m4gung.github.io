package com.tokomanajemen.modules.inventory;

import com.tokomanajemen.common.ApiResponse;
import com.tokomanajemen.modules.inventory.dto.StockAdjustmentRequest;
import com.tokomanajemen.modules.inventory.model.StockMutation;
import com.tokomanajemen.modules.inventory.repository.StockMutationRepository;
import com.tokomanajemen.modules.product.model.Product;
import com.tokomanajemen.modules.product.repository.ProductRepository;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/inventory")
public class InventoryController {

    private final ProductRepository productRepository;
    private final StockMutationRepository stockMutationRepository;

    public InventoryController(ProductRepository productRepository, StockMutationRepository stockMutationRepository) {
        this.productRepository = productRepository;
        this.stockMutationRepository = stockMutationRepository;
    }

    @PostMapping("/adjust")
    @PreAuthorize("hasRole('OWNER')")
    @Transactional
    public ResponseEntity<ApiResponse<Product>> adjustStock(@Valid @RequestBody StockAdjustmentRequest request, Authentication authentication) {
        Product product = productRepository.findById(request.getProductId()).orElse(null);
        if (product == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Produk tidak ditemukan"));
        }

        if (request.getNewStock() < 0) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Stok barang tidak boleh bernilai negatif"));
        }

        int currentStock = product.getStock();
        int diff = request.getNewStock() - currentStock;

        product.setStock(request.getNewStock());
        product.setUpdatedAt(Instant.now());
        Product updatedProduct = productRepository.save(product);

        // Rekam riwayat mutasi stok untuk audit
        String operator = (authentication != null) ? authentication.getName() : "OWNER";
        StockMutation mutation = new StockMutation(
                "MUT-" + UUID.randomUUID().toString().substring(0, 8),
                product.getId(),
                product.getName(),
                "ADJUSTMENT",
                diff,
                "ADJ-" + request.getReason(),
                request.getReason() + ": " + (request.getNotes() != null ? request.getNotes() : "Penyesuaian stok opname"),
                operator
        );
        stockMutationRepository.save(mutation);

        return ResponseEntity.ok(ApiResponse.ok("Stok berhasil diperbarui", updatedProduct));
    }

    @GetMapping("/mutations")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<ApiResponse<List<StockMutation>>> getMutations(@RequestParam(required = false) String productId) {
        List<StockMutation> list;
        if (productId != null && !productId.isBlank()) {
            list = stockMutationRepository.findByProductIdOrderByCreatedAtDesc(productId);
        } else {
            list = stockMutationRepository.findAllByOrderByCreatedAtDesc();
        }
        return ResponseEntity.ok(ApiResponse.ok(list));
    }
}
