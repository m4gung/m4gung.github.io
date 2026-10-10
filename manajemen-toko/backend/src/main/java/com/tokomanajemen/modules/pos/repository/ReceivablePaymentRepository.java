package com.tokomanajemen.modules.pos.repository;

import com.tokomanajemen.modules.pos.model.ReceivablePayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReceivablePaymentRepository extends JpaRepository<ReceivablePayment, String> {
    List<ReceivablePayment> findByReceivableIdOrderByPaymentDateDesc(String receivableId);
}
