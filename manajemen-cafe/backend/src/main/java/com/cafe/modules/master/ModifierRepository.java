package com.cafe.modules.master;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ModifierRepository extends JpaRepository<Modifier, Long> {
    List<Modifier> findByTenantId(Long tenantId);
    Optional<Modifier> findByIdAndTenantId(Long id, Long tenantId);
}
