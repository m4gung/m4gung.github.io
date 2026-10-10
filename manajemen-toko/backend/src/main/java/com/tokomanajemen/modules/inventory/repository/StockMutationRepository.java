package com.tokomanajemen.modules.inventory.repository;

import com.tokomanajemen.modules.inventory.model.StockMutation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StockMutationRepository extends JpaRepository<StockMutation, String> {
    List<StockMutation> findByProductIdOrderByCreatedAtDesc(String productId);
    List<StockMutation> findAllByOrderByCreatedAtDesc();
}
