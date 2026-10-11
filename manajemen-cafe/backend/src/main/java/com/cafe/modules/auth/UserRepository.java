package com.cafe.modules.auth;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByTenantIdAndUsername(Long tenantId, String username);
    Optional<User> findByUsername(String username);
    boolean existsByTenantIdAndUsername(Long tenantId, String username);
    boolean existsByTenantIdAndEmail(Long tenantId, String email);
    List<User> findByTenantId(Long tenantId);
}
