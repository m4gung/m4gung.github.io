package com.tokomanajemen.modules.product;

import com.tokomanajemen.common.ApiResponse;
import com.tokomanajemen.modules.product.model.Category;
import com.tokomanajemen.modules.product.repository.CategoryRepository;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/categories")
public class CategoryController {

    private final CategoryRepository categoryRepository;

    public CategoryController(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Category>>> getAllCategories() {
        return ResponseEntity.ok(ApiResponse.ok(categoryRepository.findAll()));
    }

    @PostMapping
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<ApiResponse<Category>> createCategory(@Valid @RequestBody Category category) {
        if (categoryRepository.existsByName(category.getName())) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Kategori '" + category.getName() + "' sudah ada"));
        }

        if (category.getId() == null || category.getId().isBlank()) {
            category.setId("CAT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        }
        category.setCreatedAt(Instant.now());

        Category saved = categoryRepository.save(category);
        return ResponseEntity.ok(ApiResponse.ok("Kategori berhasil ditambahkan", saved));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(@PathVariable String id) {
        if (!categoryRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        categoryRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.ok("Kategori berhasil dihapus", null));
    }
}
