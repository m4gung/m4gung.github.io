package com.tokomanajemen.modules.purchase;

import com.tokomanajemen.common.ApiResponse;
import com.tokomanajemen.modules.purchase.model.Supplier;
import com.tokomanajemen.modules.purchase.repository.SupplierRepository;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/suppliers")
public class SupplierController {

    private final SupplierRepository supplierRepository;

    public SupplierController(SupplierRepository supplierRepository) {
        this.supplierRepository = supplierRepository;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER', 'CASHIER')")
    public ResponseEntity<ApiResponse<List<Supplier>>> getAllSuppliers() {
        return ResponseEntity.ok(ApiResponse.ok(supplierRepository.findByActiveTrue()));
    }

    @PostMapping
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<ApiResponse<Supplier>> createSupplier(@Valid @RequestBody Supplier supplier) {
        if (supplier.getId() == null || supplier.getId().isBlank()) {
            supplier.setId("SUP-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        }
        supplier.setActive(true);
        supplier.setCreatedAt(Instant.now());
        supplier.setUpdatedAt(Instant.now());

        Supplier saved = supplierRepository.save(supplier);
        return ResponseEntity.ok(ApiResponse.ok("Supplier berhasil ditambahkan", saved));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<ApiResponse<Supplier>> updateSupplier(@PathVariable String id, @Valid @RequestBody Supplier supplier) {
        Supplier existing = supplierRepository.findById(id).orElse(null);
        if (existing == null) {
            return ResponseEntity.notFound().build();
        }

        existing.setName(supplier.getName());
        existing.setPhone(supplier.getPhone());
        existing.setAddress(supplier.getAddress());
        existing.setUpdatedAt(Instant.now());

        Supplier updated = supplierRepository.save(existing);
        return ResponseEntity.ok(ApiResponse.ok("Supplier berhasil diperbarui", updated));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<ApiResponse<Void>> deleteSupplier(@PathVariable String id) {
        return supplierRepository.findById(id)
                .map(s -> {
                    s.setActive(false);
                    s.setUpdatedAt(Instant.now());
                    supplierRepository.save(s);
                    return ResponseEntity.ok(ApiResponse.<Void>ok("Supplier berhasil dinonaktifkan", null));
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
