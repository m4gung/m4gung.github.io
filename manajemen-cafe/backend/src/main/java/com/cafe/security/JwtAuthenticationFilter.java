package com.cafe.security;

import com.cafe.common.TenantContext;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider tokenProvider;

    public JwtAuthenticationFilter(JwtTokenProvider tokenProvider) {
        this.tokenProvider = tokenProvider;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        try {
            String token = resolveToken(request);
            if (StringUtils.hasText(token) && tokenProvider.validateToken(token)) {
                Claims claims = tokenProvider.getClaims(token);
                String username = claims.getSubject();
                String role = claims.get("role", String.class);
                Long tenantId = claims.get("tenantId", Number.class) != null ? claims.get("tenantId", Number.class).longValue() : null;
                Long outletId = claims.get("outletId", Number.class) != null ? claims.get("outletId", Number.class).longValue() : null;

                // Support switching outlet via X-Outlet-ID header for multi-outlet
                String overrideOutletHeader = request.getHeader("X-Outlet-ID");
                if (StringUtils.hasText(overrideOutletHeader)) {
                    try {
                        outletId = Long.parseLong(overrideOutletHeader);
                    } catch (NumberFormatException ignored) {}
                }

                TenantContext.setTenantId(tenantId);
                TenantContext.setOutletId(outletId);

                SimpleGrantedAuthority authority = new SimpleGrantedAuthority("ROLE_" + role);
                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(username, null, Collections.singletonList(authority));
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }

            filterChain.doFilter(request, response);
        } finally {
            TenantContext.clear();
        }
    }

    private String resolveToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
