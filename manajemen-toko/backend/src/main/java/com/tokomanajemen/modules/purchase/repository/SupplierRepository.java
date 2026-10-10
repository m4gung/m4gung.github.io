package com.tokomanajemen.modules.purchase.repository;

import com.tokomanajemen.modules.purchase.model.Supplier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SupplierRepository extends JpaRepository<Supplier, String> {
    List<Supplier> findByActiveTrue();
    boolean existsByName(String name);
}
