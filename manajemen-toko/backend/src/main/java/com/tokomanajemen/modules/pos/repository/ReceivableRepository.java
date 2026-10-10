package com.tokomanajemen.modules.pos.repository;

import com.tokomanajemen.modules.pos.model.Receivable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ReceivableRepository extends JpaRepository<Receivable, String> {
    List<Receivable> findByCustomerId(String customerId);
    List<Receivable> findByStatus(String status);
    List<Receivable> findByDueDateBeforeAndStatusNot(LocalDate date, String status);
}
