package com.tokomanajemen.modules.product.repository;

import com.tokomanajemen.modules.product.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, String> {
    Optional<Product> findBySku(String sku);
    Optional<Product> findByBarcode(String barcode);
    List<Product> findByActiveTrue();
    boolean existsBySkuAndIdNot(String sku, String id);
    boolean existsBySku(String sku);
}
