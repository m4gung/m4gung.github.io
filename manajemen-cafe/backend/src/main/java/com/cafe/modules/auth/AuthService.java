package com.cafe.modules.auth;

import com.cafe.common.TenantContext;
import com.cafe.modules.auth.dto.*;
import com.cafe.security.JwtTokenProvider;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AuthService {

    private final TenantRepository tenantRepository;
    private final OutletRepository outletRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public AuthService(
            TenantRepository tenantRepository,
            OutletRepository outletRepository,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtTokenProvider jwtTokenProvider) {
        this.tenantRepository = tenantRepository;
        this.outletRepository = outletRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Transactional
    public AuthResponse registerTenant(RegisterTenantRequest request) {
        String cleanCode = request.getTenantCode().trim().toLowerCase();
        if (tenantRepository.existsByCode(cleanCode)) {
            throw new IllegalArgumentException("Kode café '" + cleanCode + "' sudah terdaftar, silakan pilih kode lain");
        }

        // 1. Create Tenant
        Tenant tenant = new Tenant(request.getTenantName(), cleanCode);
        tenant = tenantRepository.save(tenant);

        // 2. Create Initial Outlet
        Outlet outlet = new Outlet(tenant, request.getOutletName());
        outlet = outletRepository.save(outlet);

        // 3. Create Owner User
        User user = new User();
        user.setTenant(tenant);
        user.setOutlet(outlet);
        user.setUsername(request.getUsername().trim().toLowerCase());
        user.setEmail(request.getEmail().trim().toLowerCase());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setFullName(request.getFullName());
        user.setRole("OWNER");
        user.setIsActive(true);
        user = userRepository.save(user);

        // 4. Generate Token
        String token = jwtTokenProvider.generateToken(
                user.getId(),
                tenant.getId(),
                outlet.getId(),
                user.getUsername(),
                user.getRole()
        );

        return buildAuthResponse(token, user, tenant, List.of(outlet));
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        User user;
        String cleanUsername = request.getUsername().trim().toLowerCase();

        if (request.getTenantCode() != null && !request.getTenantCode().isBlank()) {
            String cleanCode = request.getTenantCode().trim().toLowerCase();
            Tenant tenant = tenantRepository.findByCode(cleanCode)
                    .orElseThrow(() -> new BadCredentialsException("Café atau pengguna tidak ditemukan"));
            user = userRepository.findByTenantIdAndUsername(tenant.getId(), cleanUsername)
                    .orElseThrow(() -> new BadCredentialsException("Username atau password salah"));
        } else {
            user = userRepository.findByUsername(cleanUsername)
                    .orElseThrow(() -> new BadCredentialsException("Username atau password salah"));
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Username atau password salah");
        }

        if (!Boolean.TRUE.equals(user.getIsActive())) {
            throw new IllegalArgumentException("Akun Anda telah dinonaktifkan, hubungi pemilik kafe");
        }

        Tenant tenant = user.getTenant();
        List<Outlet> outlets = outletRepository.findByTenantId(tenant.getId());
        Long outletId = user.getOutlet() != null ? user.getOutlet().getId() : (outlets.isEmpty() ? null : outlets.get(0).getId());

        String token = jwtTokenProvider.generateToken(
                user.getId(),
                tenant.getId(),
                outletId,
                user.getUsername(),
                user.getRole()
        );

        return buildAuthResponse(token, user, tenant, outlets);
    }

    @Transactional(readOnly = true)
    public AuthResponse getCurrentUser(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User tidak ditemukan"));
        Tenant tenant = user.getTenant();
        List<Outlet> outlets = outletRepository.findByTenantId(tenant.getId());
        Long outletId = TenantContext.getOutletId() != null ? TenantContext.getOutletId() :
                (user.getOutlet() != null ? user.getOutlet().getId() : null);

        String token = jwtTokenProvider.generateToken(
                user.getId(),
                tenant.getId(),
                outletId,
                user.getUsername(),
                user.getRole()
        );

        return buildAuthResponse(token, user, tenant, outlets);
    }

    private AuthResponse buildAuthResponse(String token, User user, Tenant tenant, List<Outlet> outlets) {
        UserDto userDto = new UserDto();
        userDto.setId(user.getId());
        userDto.setTenantId(tenant.getId());
        userDto.setOutletId(user.getOutlet() != null ? user.getOutlet().getId() : null);
        userDto.setUsername(user.getUsername());
        userDto.setEmail(user.getEmail());
        userDto.setFullName(user.getFullName());
        userDto.setRole(user.getRole());
        userDto.setIsActive(user.getIsActive());

        TenantDto tenantDto = new TenantDto(
                tenant.getId(),
                tenant.getName(),
                tenant.getCode(),
                tenant.getPlan(),
                tenant.getStatus()
        );

        List<OutletDto> outletDtos = outlets.stream().map(o -> {
            OutletDto dto = new OutletDto();
            dto.setId(o.getId());
            dto.setTenantId(tenant.getId());
            dto.setName(o.getName());
            dto.setAddress(o.getAddress());
            dto.setPhone(o.getPhone());
            dto.setReceiptHeader(o.getReceiptHeader());
            dto.setReceiptFooter(o.getReceiptFooter());
            dto.setTaxPercentage(o.getTaxPercentage());
            dto.setServiceChargePercentage(o.getServiceChargePercentage());
            dto.setIsActive(o.getIsActive());
            return dto;
        }).collect(Collectors.toList());

        return new AuthResponse(token, userDto, tenantDto, outletDtos);
    }
}
