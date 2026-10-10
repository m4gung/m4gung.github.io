package com.tokomanajemen.modules.pos.repository;

import com.tokomanajemen.modules.pos.model.Sale;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SaleRepository extends JpaRepository<Sale, String> {
    Optional<Sale> findByInvoiceNo(String invoiceNo);
    List<Sale> findAllByOrderByCreatedAtDesc();
    boolean existsByInvoiceNo(String invoiceNo);
}
