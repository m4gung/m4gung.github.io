package com.cafe.modules.master;

import com.cafe.common.TenantContext;
import com.cafe.modules.auth.Outlet;
import com.cafe.modules.auth.OutletRepository;
import com.cafe.modules.auth.Tenant;
import com.cafe.modules.auth.TenantRepository;
import com.cafe.modules.master.dto.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class MasterDataService {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final ProductVariantRepository variantRepository;
    private final ModifierRepository modifierRepository;
    private final DiningTableRepository diningTableRepository;
    private final TenantRepository tenantRepository;
    private final OutletRepository outletRepository;

    public MasterDataService(
            CategoryRepository categoryRepository,
            ProductRepository productRepository,
            ProductVariantRepository variantRepository,
            ModifierRepository modifierRepository,
            DiningTableRepository diningTableRepository,
            TenantRepository tenantRepository,
            OutletRepository outletRepository) {
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
        this.variantRepository = variantRepository;
        this.modifierRepository = modifierRepository;
        this.diningTableRepository = diningTableRepository;
        this.tenantRepository = tenantRepository;
        this.outletRepository = outletRepository;
    }

    private Tenant getRequiredCurrentTenant() {
        Long tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            throw new IllegalArgumentException("Tenant context tidak ditemukan");
        }
        return tenantRepository.findById(tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Tenant tidak ditemukan"));
    }

    // ================= CATEGORIES =================
    @Transactional(readOnly = true)
    public List<CategoryDto> getCategories() {
        Long tenantId = getRequiredCurrentTenant().getId();
        return categoryRepository.findByTenantIdOrderBySortOrderAsc(tenantId).stream()
                .map(c -> new CategoryDto(c.getId(), c.getName(), c.getSortOrder(), c.getIsActive()))
                .collect(Collectors.toList());
    }

    @Transactional
    public CategoryDto saveCategory(CategoryDto dto) {
        Tenant tenant = getRequiredCurrentTenant();
        Category category;
        if (dto.getId() != null) {
            category = categoryRepository.findByIdAndTenantId(dto.getId(), tenant.getId())
                    .orElseThrow(() -> new IllegalArgumentException("Kategori tidak ditemukan"));
        } else {
            category = new Category();
            category.setTenant(tenant);
        }
        category.setName(dto.getName());
        category.setSortOrder(dto.getSortOrder() != null ? dto.getSortOrder() : 0);
        category.setIsActive(dto.getIsActive() != null ? dto.getIsActive() : true);
        category.setUpdatedAt(Instant.now());
        category = categoryRepository.save(category);

        dto.setId(category.getId());
        return dto;
    }

    @Transactional
    public void deleteCategory(Long id) {
        Long tenantId = getRequiredCurrentTenant().getId();
        Category category = categoryRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Kategori tidak ditemukan"));
        categoryRepository.delete(category);
    }

    // ================= PRODUCTS =================
    @Transactional(readOnly = true)
    public List<ProductDto> getProducts() {
        Long tenantId = getRequiredCurrentTenant().getId();
        return productRepository.findByTenantIdOrderByNameAsc(tenantId).stream()
                .map(this::mapProductToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public ProductDto saveProduct(ProductDto dto) {
        Tenant tenant = getRequiredCurrentTenant();
        Product product;
        if (dto.getId() != null) {
            product = productRepository.findByIdAndTenantId(dto.getId(), tenant.getId())
                    .orElseThrow(() -> new IllegalArgumentException("Produk tidak ditemukan"));
        } else {
            product = new Product();
            product.setTenant(tenant);
        }

        if (dto.getCategoryId() != null) {
            Category category = categoryRepository.findByIdAndTenantId(dto.getCategoryId(), tenant.getId())
                    .orElseThrow(() -> new IllegalArgumentException("Kategori tidak valid"));
            product.setCategory(category);
        } else {
            product.setCategory(null);
        }

        product.setName(dto.getName());
        product.setCode(dto.getCode());
        product.setDescription(dto.getDescription());
        product.setImageUrl(dto.getImageUrl());
        product.setBasePrice(dto.getBasePrice());
        product.setIsActive(dto.getIsActive() != null ? dto.getIsActive() : true);
        product.setUpdatedAt(Instant.now());

        // Manage variants
        product.getVariants().clear();
        if (dto.getVariants() != null) {
            for (ProductVariantDto varDto : dto.getVariants()) {
                ProductVariant variant = new ProductVariant(product, varDto.getName(), varDto.getPriceAdjustment());
                variant.setIsActive(varDto.getIsActive() != null ? varDto.getIsActive() : true);
                product.getVariants().add(variant);
            }
        }

        product = productRepository.save(product);
        return mapProductToDto(product);
    }

    @Transactional
    public void deleteProduct(Long id) {
        Long tenantId = getRequiredCurrentTenant().getId();
        Product product = productRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Produk tidak ditemukan"));
        productRepository.delete(product);
    }

    private ProductDto mapProductToDto(Product p) {
        ProductDto dto = new ProductDto();
        dto.setId(p.getId());
        dto.setCategoryId(p.getCategory() != null ? p.getCategory().getId() : null);
        dto.setCategoryName(p.getCategory() != null ? p.getCategory().getName() : null);
        dto.setName(p.getName());
        dto.setCode(p.getCode());
        dto.setDescription(p.getDescription());
        dto.setImageUrl(p.getImageUrl());
        dto.setBasePrice(p.getBasePrice());
        dto.setIsActive(p.getIsActive());

        List<ProductVariantDto> variantDtos = p.getVariants().stream()
                .map(v -> new ProductVariantDto(v.getId(), v.getName(), v.getPriceAdjustment(), v.getIsActive()))
                .collect(Collectors.toList());
        dto.setVariants(variantDtos);

        return dto;
    }

    // ================= MODIFIERS =================
    @Transactional(readOnly = true)
    public List<ModifierDto> getModifiers() {
        Long tenantId = getRequiredCurrentTenant().getId();
        return modifierRepository.findByTenantId(tenantId).stream()
                .map(m -> new ModifierDto(m.getId(), m.getName(), m.getPrice(), m.getIsActive()))
                .collect(Collectors.toList());
    }

    @Transactional
    public ModifierDto saveModifier(ModifierDto dto) {
        Tenant tenant = getRequiredCurrentTenant();
        Modifier modifier;
        if (dto.getId() != null) {
            modifier = modifierRepository.findByIdAndTenantId(dto.getId(), tenant.getId())
                    .orElseThrow(() -> new IllegalArgumentException("Modifier tidak ditemukan"));
        } else {
            modifier = new Modifier();
            modifier.setTenant(tenant);
        }

        modifier.setName(dto.getName());
        modifier.setPrice(dto.getPrice());
        modifier.setIsActive(dto.getIsActive() != null ? dto.getIsActive() : true);
        modifier = modifierRepository.save(modifier);

        dto.setId(modifier.getId());
        return dto;
    }

    @Transactional
    public void deleteModifier(Long id) {
        Long tenantId = getRequiredCurrentTenant().getId();
        Modifier modifier = modifierRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Modifier tidak ditemukan"));
        modifierRepository.delete(modifier);
    }

    // ================= DINING TABLES =================
    @Transactional(readOnly = true)
    public List<DiningTableDto> getTables(Long outletId) {
        Long effectiveOutletId = outletId != null ? outletId : TenantContext.getOutletId();
        if (effectiveOutletId == null) {
            throw new IllegalArgumentException("Outlet ID diperlukan untuk melihat data meja");
        }
        return diningTableRepository.findByOutletIdOrderByTableNumberAsc(effectiveOutletId).stream()
                .map(t -> new DiningTableDto(t.getId(), t.getOutlet().getId(), t.getTableNumber(), t.getCapacity(), t.getStatus()))
                .collect(Collectors.toList());
    }

    @Transactional
    public DiningTableDto saveTable(DiningTableDto dto) {
        Long effectiveOutletId = dto.getOutletId() != null ? dto.getOutletId() : TenantContext.getOutletId();
        if (effectiveOutletId == null) {
            throw new IllegalArgumentException("Outlet ID diperlukan");
        }
        Outlet outlet = outletRepository.findById(effectiveOutletId)
                .orElseThrow(() -> new IllegalArgumentException("Outlet tidak ditemukan"));

        DiningTable table;
        if (dto.getId() != null) {
            table = diningTableRepository.findByIdAndOutletId(dto.getId(), effectiveOutletId)
                    .orElseThrow(() -> new IllegalArgumentException("Meja tidak ditemukan"));
        } else {
            table = new DiningTable();
            table.setOutlet(outlet);
        }

        table.setTableNumber(dto.getTableNumber());
        table.setCapacity(dto.getCapacity() != null ? dto.getCapacity() : 4);
        table.setStatus(dto.getStatus() != null ? dto.getStatus() : "AVAILABLE");
        table = diningTableRepository.save(table);

        dto.setId(table.getId());
        dto.setOutletId(outlet.getId());
        return dto;
    }

    @Transactional
    public void deleteTable(Long id, Long outletId) {
        Long effectiveOutletId = outletId != null ? outletId : TenantContext.getOutletId();
        DiningTable table = diningTableRepository.findByIdAndOutletId(id, effectiveOutletId)
                .orElseThrow(() -> new IllegalArgumentException("Meja tidak ditemukan"));
        diningTableRepository.delete(table);
    }
}
