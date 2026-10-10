package com.tokomanajemen.modules.accounting.repository;

import com.tokomanajemen.modules.accounting.model.JournalEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface JournalEntryRepository extends JpaRepository<JournalEntry, String> {
    List<JournalEntry> findAllByOrderByEntryDateDesc();
    List<JournalEntry> findByEntryDateBetweenOrderByEntryDateAsc(Instant start, Instant end);
}
