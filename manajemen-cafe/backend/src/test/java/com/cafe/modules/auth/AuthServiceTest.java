package com.cafe.modules.auth;

import com.cafe.modules.auth.dto.AuthResponse;
import com.cafe.modules.auth.dto.LoginRequest;
import com.cafe.modules.auth.dto.RegisterTenantRequest;
import com.cafe.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private TenantRepository tenantRepository;

    @Mock
    private OutletRepository outletRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @InjectMocks
    private AuthService authService;

    private RegisterTenantRequest registerRequest;

    @BeforeEach
    void setUp() {
        registerRequest = new RegisterTenantRequest();
        registerRequest.setTenantName("Kopi Senja");
        registerRequest.setTenantCode("kopisenja");
        registerRequest.setOutletName("Cabang Pusat");
        registerRequest.setFullName("Budi Santoso");
        registerRequest.setEmail("budi@kopisenja.com");
        registerRequest.setUsername("budiowner");
        registerRequest.setPassword("password123");
    }

    @Test
    void shouldRegisterTenantSuccessfully() {
        when(tenantRepository.existsByCode("kopisenja")).thenReturn(false);

        Tenant tenant = new Tenant("Kopi Senja", "kopisenja");
        tenant.setId(1L);
        when(tenantRepository.save(any(Tenant.class))).thenReturn(tenant);

        Outlet outlet = new Outlet(tenant, "Cabang Pusat");
        outlet.setId(10L);
        when(outletRepository.save(any(Outlet.class))).thenReturn(outlet);

        when(passwordEncoder.encode("password123")).thenReturn("hashedPass");

        User user = new User();
        user.setId(100L);
        user.setTenant(tenant);
        user.setOutlet(outlet);
        user.setUsername("budiowner");
        user.setEmail("budi@kopisenja.com");
        user.setFullName("Budi Santoso");
        user.setRole("OWNER");
        user.setIsActive(true);
        when(userRepository.save(any(User.class))).thenReturn(user);

        when(jwtTokenProvider.generateToken(eq(100L), eq(1L), eq(10L), eq("budiowner"), eq("OWNER")))
                .thenReturn("mocked.jwt.token");

        AuthResponse response = authService.registerTenant(registerRequest);

        assertNotNull(response);
        assertEquals("mocked.jwt.token", response.getToken());
        assertEquals("budiowner", response.getUser().getUsername());
        assertEquals("Kopi Senja", response.getTenant().getName());
        assertEquals(1, response.getOutlets().size());
        assertEquals("Cabang Pusat", response.getOutlets().get(0).getName());
    }

    @Test
    void shouldRejectDuplicateTenantCode() {
        when(tenantRepository.existsByCode("kopisenja")).thenReturn(true);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                authService.registerTenant(registerRequest)
        );

        assertTrue(ex.getMessage().contains("sudah terdaftar"));
    }

    @Test
    void shouldLoginSuccessfully() {
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername("budiowner");
        loginRequest.setPassword("password123");

        Tenant tenant = new Tenant("Kopi Senja", "kopisenja");
        tenant.setId(1L);

        Outlet outlet = new Outlet(tenant, "Cabang Pusat");
        outlet.setId(10L);

        User user = new User();
        user.setId(100L);
        user.setTenant(tenant);
        user.setOutlet(outlet);
        user.setUsername("budiowner");
        user.setPasswordHash("hashedPass");
        user.setFullName("Budi Santoso");
        user.setRole("OWNER");
        user.setIsActive(true);

        when(userRepository.findByUsername("budiowner")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password123", "hashedPass")).thenReturn(true);
        when(outletRepository.findByTenantId(1L)).thenReturn(List.of(outlet));
        when(jwtTokenProvider.generateToken(any(), any(), any(), any(), any())).thenReturn("login.jwt.token");

        AuthResponse response = authService.login(loginRequest);

        assertNotNull(response);
        assertEquals("login.jwt.token", response.getToken());
        assertEquals("budiowner", response.getUser().getUsername());
    }

    @Test
    void shouldRejectBadPassword() {
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername("budiowner");
        loginRequest.setPassword("wrongpass");

        User user = new User();
        user.setUsername("budiowner");
        user.setPasswordHash("hashedPass");

        when(userRepository.findByUsername("budiowner")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrongpass", "hashedPass")).thenReturn(false);

        assertThrows(BadCredentialsException.class, () -> authService.login(loginRequest));
    }
}
