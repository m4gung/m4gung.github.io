package com.tokomanajemen.modules.auth;

import com.tokomanajemen.common.ApiResponse;
import com.tokomanajemen.modules.auth.dto.LoginRequest;
import com.tokomanajemen.modules.auth.dto.LoginResponse;
import com.tokomanajemen.modules.auth.model.User;
import com.tokomanajemen.modules.auth.repository.UserRepository;
import com.tokomanajemen.security.JwtTokenProvider;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    public AuthController(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtTokenProvider tokenProvider) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
    }

    @GetMapping("/ping")
    public ResponseEntity<ApiResponse<String>> ping() {
        return ResponseEntity.ok(ApiResponse.ok("Backend Manajemen Toko Spring Boot Aktif dan Terhubung!"));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new BadCredentialsException("Username atau password salah"));

        if (!user.isActive()) {
            throw new BadCredentialsException("Akun dinonaktifkan oleh administrator");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Username atau password salah");
        }

        String token = tokenProvider.generateToken(user.getUsername(), user.getRole().name());

        LoginResponse response = new LoginResponse(
                token,
                user.getId(),
                user.getUsername(),
                user.getFullName(),
                user.getRole().name()
        );

        return ResponseEntity.ok(ApiResponse.ok("Login berhasil", response));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<User>> getCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body(ApiResponse.error("Belum terautentikasi"));
        }

        String username = authentication.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BadCredentialsException("Pengguna tidak ditemukan"));

        // Sembunyikan password hash dari response
        user.setPasswordHash("PROTECTED");

        return ResponseEntity.ok(ApiResponse.ok(user));
    }
}
