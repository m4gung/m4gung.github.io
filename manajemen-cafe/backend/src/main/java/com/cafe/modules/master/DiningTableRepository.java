package com.cafe.modules.master;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DiningTableRepository extends JpaRepository<DiningTable, Long> {
    List<DiningTable> findByOutletIdOrderByTableNumberAsc(Long outletId);
    Optional<DiningTable> findByIdAndOutletId(Long id, Long outletId);
}
