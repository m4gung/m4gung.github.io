package com.cafe.modules.auth;

import com.cafe.common.ApiResponse;
import com.cafe.modules.auth.dto.AuthResponse;
import com.cafe.modules.auth.dto.LoginRequest;
import com.cafe.modules.auth.dto.RegisterTenantRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterTenantRequest request) {
        AuthResponse response = authService.registerTenant(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Registrasi café berhasil"));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Login berhasil"));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<AuthResponse>> getCurrentUser(@AuthenticationPrincipal String username) {
        if (username == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Sesi telah berakhir, silakan login kembali"));
        }
        AuthResponse response = authService.getCurrentUser(username);
        return ResponseEntity.ok(ApiResponse.success(response, "Data sesi berhasil dimuat"));
    }
}
