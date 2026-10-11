package com.cafe.modules.master;

import com.cafe.common.TenantContext;
import com.cafe.modules.auth.Outlet;
import com.cafe.modules.auth.OutletRepository;
import com.cafe.modules.auth.Tenant;
import com.cafe.modules.auth.TenantRepository;
import com.cafe.modules.master.dto.*;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MasterDataServiceTest {

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ProductVariantRepository variantRepository;

    @Mock
    private ModifierRepository modifierRepository;

    @Mock
    private DiningTableRepository diningTableRepository;

    @Mock
    private TenantRepository tenantRepository;

    @Mock
    private OutletRepository outletRepository;

    @InjectMocks
    private MasterDataService masterDataService;

    private Tenant tenant;
    private Outlet outlet;

    @BeforeEach
    void setUp() {
        tenant = new Tenant("Kopi Senja", "kopisenja");
        tenant.setId(1L);

        outlet = new Outlet(tenant, "Pusat");
        outlet.setId(10L);

        TenantContext.setTenantId(1L);
        TenantContext.setOutletId(10L);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void shouldCreateCategorySuccessfully() {
        when(tenantRepository.findById(1L)).thenReturn(Optional.of(tenant));

        Category category = new Category(tenant, "Espresso", 1);
        category.setId(100L);
        when(categoryRepository.save(any(Category.class))).thenReturn(category);

        CategoryDto dto = new CategoryDto(null, "Espresso", 1, true);
        CategoryDto result = masterDataService.saveCategory(dto);

        assertNotNull(result);
        assertEquals(100L, result.getId());
        assertEquals("Espresso", result.getName());
    }

    @Test
    void shouldCreateProductWithVariants() {
        when(tenantRepository.findById(1L)).thenReturn(Optional.of(tenant));

        Product product = new Product();
        product.setId(200L);
        product.setTenant(tenant);
        product.setName("Americano");
        product.setBasePrice(new BigDecimal("20000"));

        when(productRepository.save(any(Product.class))).thenReturn(product);

        ProductDto dto = new ProductDto();
        dto.setName("Americano");
        dto.setBasePrice(new BigDecimal("20000"));
        dto.setVariants(List.of(
                new ProductVariantDto(null, "Large", new BigDecimal("5000"), true),
                new ProductVariantDto(null, "Iced", new BigDecimal("2000"), true)
        ));

        ProductDto result = masterDataService.saveProduct(dto);

        assertNotNull(result);
        assertEquals(200L, result.getId());
        assertEquals("Americano", result.getName());
    }

    @Test
    void shouldCreateModifierSuccessfully() {
        when(tenantRepository.findById(1L)).thenReturn(Optional.of(tenant));

        Modifier modifier = new Modifier(tenant, "Extra Shot", new BigDecimal("6000"));
        modifier.setId(300L);
        when(modifierRepository.save(any(Modifier.class))).thenReturn(modifier);

        ModifierDto dto = new ModifierDto(null, "Extra Shot", new BigDecimal("6000"), true);
        ModifierDto result = masterDataService.saveModifier(dto);

        assertNotNull(result);
        assertEquals(300L, result.getId());
        assertEquals("Extra Shot", result.getName());
    }

    @Test
    void shouldCreateTableSuccessfully() {
        when(outletRepository.findById(10L)).thenReturn(Optional.of(outlet));

        DiningTable table = new DiningTable(outlet, "Meja 12", 4);
        table.setId(400L);
        when(diningTableRepository.save(any(DiningTable.class))).thenReturn(table);

        DiningTableDto dto = new DiningTableDto(null, 10L, "Meja 12", 4, "AVAILABLE");
        DiningTableDto result = masterDataService.saveTable(dto);

        assertNotNull(result);
        assertEquals(400L, result.getId());
        assertEquals("Meja 12", result.getTableNumber());
    }
}
