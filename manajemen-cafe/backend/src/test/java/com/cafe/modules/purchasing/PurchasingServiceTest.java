package com.cafe.modules.purchasing;

import com.cafe.common.TenantContext;
import com.cafe.modules.auth.Outlet;
import com.cafe.modules.auth.OutletRepository;
import com.cafe.modules.auth.Tenant;
import com.cafe.modules.auth.TenantRepository;
import com.cafe.modules.inventory.Ingredient;
import com.cafe.modules.inventory.IngredientRepository;
import com.cafe.modules.inventory.StockMovementRepository;
import com.cafe.modules.purchasing.dto.PurchaseDto;
import com.cafe.modules.purchasing.dto.PurchaseItemDto;
import com.cafe.modules.purchasing.dto.SupplierDto;
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
class PurchasingServiceTest {

    @Mock
    private SupplierRepository supplierRepository;

    @Mock
    private PurchaseRepository purchaseRepository;

    @Mock
    private PurchaseItemRepository purchaseItemRepository;

    @Mock
    private IngredientRepository ingredientRepository;

    @Mock
    private StockMovementRepository stockMovementRepository;

    @Mock
    private TenantRepository tenantRepository;

    @Mock
    private OutletRepository outletRepository;

    @InjectMocks
    private PurchasingService purchasingService;

    private Tenant tenant;
    private Outlet outlet;
    private Ingredient milk;
    private Supplier supplier;

    @BeforeEach
    void setUp() {
        tenant = new Tenant("Kopi Senja", "kopisenja");
        tenant.setId(1L);

        outlet = new Outlet(tenant, "Cabang Pusat");
        outlet.setId(1L);

        milk = new Ingredient(tenant, "Susu Fresh Milk", "ml", new BigDecimal("20.00"), new BigDecimal("1000.00"), new BigDecimal("5000.00"));
        milk.setId(10L);

        supplier = new Supplier();
        supplier.setId(5L);
        supplier.setTenant(tenant);
        supplier.setName("PT Susu Segar Nusantara");

        TenantContext.setTenantId(1L);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void testSaveSupplier() {
        when(tenantRepository.findById(1L)).thenReturn(Optional.of(tenant));
        when(supplierRepository.save(any(Supplier.class))).thenAnswer(inv -> {
            Supplier s = inv.getArgument(0);
            s.setId(100L);
            return s;
        });

        SupplierDto dto = new SupplierDto();
        dto.setName("Vendor Kopi Aceh");
        dto.setPhone("0812345678");

        SupplierDto result = purchasingService.saveSupplier(dto);

        assertNotNull(result);
        assertEquals("Vendor Kopi Aceh", result.getName());
        verify(supplierRepository, times(1)).save(any(Supplier.class));
    }

    @Test
    void testCreatePurchase_ShouldIncreaseStockAndLogMovement() {
        when(tenantRepository.findById(1L)).thenReturn(Optional.of(tenant));
        when(outletRepository.findByIdAndTenantId(1L, 1L)).thenReturn(Optional.of(outlet));
        when(supplierRepository.findByIdAndTenantId(5L, 1L)).thenReturn(Optional.of(supplier));
        when(ingredientRepository.findByIdAndTenantId(10L, 1L)).thenReturn(Optional.of(milk));
        when(purchaseRepository.save(any(Purchase.class))).thenAnswer(inv -> {
            Purchase p = inv.getArgument(0);
            p.setId(200L);
            return p;
        });

        PurchaseDto dto = new PurchaseDto();
        dto.setOutletId(1L);
        dto.setSupplierId(5L);
        dto.setInvoiceNumber("INV-2026-001");
        dto.setStatus("RECEIVED");

        PurchaseItemDto itemDto = new PurchaseItemDto();
        itemDto.setIngredientId(10L);
        itemDto.setQuantity(new BigDecimal("10000.00")); // +10.000 ml
        itemDto.setUnitCost(new BigDecimal("18.50"));
        dto.setItems(List.of(itemDto));

        PurchaseDto result = purchasingService.createPurchase(dto);

        assertNotNull(result);
        assertEquals(0, new BigDecimal("185000.00").compareTo(result.getTotalAmount()));

        // Verify stock increased: 5000 + 10000 = 15000
        assertEquals(0, new BigDecimal("15000.00").compareTo(milk.getCurrentStock()));
        assertEquals(0, new BigDecimal("18.50").compareTo(milk.getCostPerUnit()));
        verify(ingredientRepository, times(1)).save(milk);
        verify(stockMovementRepository, times(1)).save(any());
        verify(purchaseRepository, times(1)).save(any(Purchase.class));
    }
}
