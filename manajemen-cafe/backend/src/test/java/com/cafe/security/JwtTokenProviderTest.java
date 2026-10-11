package com.cafe.security;

import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class JwtTokenProviderTest {

    private JwtTokenProvider jwtTokenProvider;
    private final String secret = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970";
    private final long expirationMs = 3600000;

    @BeforeEach
    void setUp() {
        jwtTokenProvider = new JwtTokenProvider(secret, expirationMs);
    }

    @Test
    void shouldGenerateAndValidateTokenWithClaims() {
        String token = jwtTokenProvider.generateToken(1L, 10L, 100L, "testowner", "OWNER");

        assertNotNull(token);
        assertTrue(jwtTokenProvider.validateToken(token));

        Claims claims = jwtTokenProvider.getClaims(token);
        assertEquals("testowner", claims.getSubject());
        assertEquals(1, claims.get("userId", Number.class).intValue());
        assertEquals(10, claims.get("tenantId", Number.class).intValue());
        assertEquals(100, claims.get("outletId", Number.class).intValue());
        assertEquals("OWNER", claims.get("role", String.class));
    }

    @Test
    void shouldRejectInvalidToken() {
        assertFalse(jwtTokenProvider.validateToken("invalid.token.here"));
    }
}
