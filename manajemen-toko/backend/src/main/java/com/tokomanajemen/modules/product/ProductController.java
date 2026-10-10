package com.tokomanajemen.modules.product;

import com.tokomanajemen.common.ApiResponse;
import com.tokomanajemen.modules.product.model.Product;
import com.tokomanajemen.modules.product.repository.ProductRepository;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/products")
public class ProductController {

    private final ProductRepository productRepository;

    public ProductController(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Product>>> getAllProducts() {
        return ResponseEntity.ok(ApiResponse.ok(productRepository.findByActiveTrue()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Product>> getProductById(@PathVariable String id) {
        return productRepository.findById(id)
                .map(p -> ResponseEntity.ok(ApiResponse.ok(p)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<ApiResponse<Product>> createProduct(@Valid @RequestBody Product product) {
        if (productRepository.existsBySku(product.getSku())) {
            return ResponseEntity.badRequest().body(ApiResponse.error("SKU '" + product.getSku() + "' sudah digunakan oleh produk lain"));
        }

        if (product.getId() == null || product.getId().isBlank()) {
            product.setId("PRD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        }
        product.setActive(true);
        product.setCreatedAt(Instant.now());
        product.setUpdatedAt(Instant.now());

        Product saved = productRepository.save(product);
        return ResponseEntity.ok(ApiResponse.ok("Produk berhasil ditambahkan", saved));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<ApiResponse<Product>> updateProduct(@PathVariable String id, @Valid @RequestBody Product product) {
        Product existing = productRepository.findById(id).orElse(null);
        if (existing == null) {
            return ResponseEntity.notFound().build();
        }

        if (productRepository.existsBySkuAndIdNot(product.getSku(), id)) {
            return ResponseEntity.badRequest().body(ApiResponse.error("SKU '" + product.getSku() + "' sudah digunakan oleh produk lain"));
        }

        existing.setSku(product.getSku());
        existing.setBarcode(product.getBarcode());
        existing.setName(product.getName());
        existing.setCategory(product.getCategory());
        existing.setUnit(product.getUnit());
        existing.setCostPrice(product.getCostPrice());
        existing.setSellingPrice(product.getSellingPrice());
        existing.setMinStock(product.getMinStock());
        existing.setUpdatedAt(Instant.now());

        Product updated = productRepository.save(existing);
        return ResponseEntity.ok(ApiResponse.ok("Produk berhasil diperbarui", updated));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<ApiResponse<Void>> deleteProduct(@PathVariable String id) {
        return productRepository.findById(id)
                .map(p -> {
                    p.setActive(false);
                    p.setUpdatedAt(Instant.now());
                    productRepository.save(p);
                    return ResponseEntity.ok(ApiResponse.<Void>ok("Produk berhasil diarsipkan", null));
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
