package com.tokomanajemen.modules.accounting.repository;

import com.tokomanajemen.modules.accounting.model.JournalLine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JournalLineRepository extends JpaRepository<JournalLine, String> {
    List<JournalLine> findByAccountCodeOrderByJournalEntry_EntryDateAsc(String accountCode);
}
