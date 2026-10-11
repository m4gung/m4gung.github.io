package com.cafe.modules.audit;

import com.cafe.modules.auth.Tenant;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "idempotency_keys", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"tenant_id", "idempotency_key"})
})
public class IdempotencyKey {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;

    @Column(name = "idempotency_key", nullable = false, length = 150)
    private String idempotencyKey;

    @Column(nullable = false, length = 200)
    private String endpoint;

    @Column(name = "request_hash", length = 100)
    private String requestHash;

    @Column(name = "response_code")
    private Integer responseCode;

    @Column(name = "response_body", columnDefinition = "TEXT")
    private String responseBody;

    @Column(length = 30)
    private String status = "IN_PROGRESS"; // IN_PROGRESS, COMPLETED, FAILED

    @Column(name = "created_at")
    private Instant createdAt = Instant.now();

    @Column(name = "expires_at")
    private Instant expiresAt;

    public IdempotencyKey() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Tenant getTenant() { return tenant; }
    public void setTenant(Tenant tenant) { this.tenant = tenant; }

    public String getIdempotencyKey() { return idempotencyKey; }
    public void setIdempotencyKey(String idempotencyKey) { this.idempotencyKey = idempotencyKey; }

    public String getEndpoint() { return endpoint; }
    public void setEndpoint(String endpoint) { this.endpoint = endpoint; }

    public String getRequestHash() { return requestHash; }
    public void setRequestHash(String requestHash) { this.requestHash = requestHash; }

    public Integer getResponseCode() { return responseCode; }
    public void setResponseCode(Integer responseCode) { this.responseCode = responseCode; }

    public String getResponseBody() { return responseBody; }
    public void setResponseBody(String responseBody) { this.responseBody = responseBody; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getExpiresAt() { return expiresAt; }
    public void setExpiresAt(Instant expiresAt) { this.expiresAt = expiresAt; }
}
