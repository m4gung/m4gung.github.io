package com.cafe.modules.inventory;

import com.cafe.common.TenantContext;
import com.cafe.modules.auth.Tenant;
import com.cafe.modules.auth.TenantRepository;
import com.cafe.modules.inventory.dto.*;
import com.cafe.modules.master.Product;
import com.cafe.modules.master.ProductRepository;
import com.cafe.modules.pos.Order;
import com.cafe.modules.pos.OrderItem;
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
class InventoryServiceTest {

    @Mock
    private IngredientRepository ingredientRepository;

    @Mock
    private RecipeRepository recipeRepository;

    @Mock
    private RecipeItemRepository recipeItemRepository;

    @Mock
    private StockMovementRepository stockMovementRepository;

    @Mock
    private TenantRepository tenantRepository;

    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private InventoryService inventoryService;

    private Tenant tenant;
    private Ingredient coffeeBeans;

    @BeforeEach
    void setUp() {
        tenant = new Tenant("Kopi Senja", "kopisenja");
        tenant.setId(1L);

        coffeeBeans = new Ingredient(
                tenant,
                "Biji Kopi Arabika",
                "GRAM",
                new BigDecimal("250.00"), // Rp 250 / gram
                new BigDecimal("500.00"), // min 500g
                new BigDecimal("2000.00") // current 2000g
        );
        coffeeBeans.setId(10L);

        TenantContext.setTenantId(1L);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void shouldSaveIngredientAndTriggerInitialStockMovement() {
        when(tenantRepository.findById(1L)).thenReturn(Optional.of(tenant));
        when(ingredientRepository.save(any(Ingredient.class))).thenAnswer(inv -> {
            Ingredient i = inv.getArgument(0);
            i.setId(10L);
            return i;
        });

        IngredientDto dto = new IngredientDto(
                null,
                "Susu Fresh Milk",
                "ML",
                new BigDecimal("20.00"),
                new BigDecimal("1000.00"),
                new BigDecimal("5000.00"),
                true
        );

        IngredientDto result = inventoryService.saveIngredient(dto);

        assertNotNull(result);
        assertEquals(10L, result.getId());
        assertEquals("Susu Fresh Milk", result.getName());
        verify(stockMovementRepository).save(any(StockMovement.class));
    }

    @Test
    void shouldAdjustStockManually() {
        when(tenantRepository.findById(1L)).thenReturn(Optional.of(tenant));
        when(ingredientRepository.findByIdAndTenantId(10L, 1L)).thenReturn(Optional.of(coffeeBeans));
        when(stockMovementRepository.save(any(StockMovement.class))).thenAnswer(inv -> inv.getArgument(0));

        StockAdjustmentRequest req = new StockAdjustmentRequest();
        req.setIngredientId(10L);
        req.setQuantityChange(new BigDecimal("-150.00")); // terbuang / tumpah
        req.setMovementType("SPOILED");
        req.setNotes("Tumpah saat kalibrasi grinder");

        StockMovementDto movement = inventoryService.adjustStock(req);

        assertNotNull(movement);
        assertEquals(new BigDecimal("2000.00"), movement.getStockBefore());
        assertEquals(new BigDecimal("1850.00"), movement.getStockAfter());
        assertEquals(new BigDecimal("1850.00"), coffeeBeans.getCurrentStock());
    }

    @Test
    void shouldDeductStockAutomaticallyForOrder() {
        Product latte = new Product();
        latte.setId(50L);
        latte.setName("Caffe Latte");

        Recipe recipe = new Recipe(tenant, latte, "Resep standar");
        RecipeItem item = new RecipeItem(recipe, coffeeBeans, new BigDecimal("18.00")); // 18 gram per cup
        recipe.getItems().add(item);

        when(recipeRepository.findByProductId(50L)).thenReturn(Optional.of(recipe));

        Order order = new Order();
        order.setTenant(tenant);
        order.setOrderNumber("CF-20261011-0001");

        OrderItem orderItem = new OrderItem();
        orderItem.setProduct(latte);
        orderItem.setProductNameSnapshot("Caffe Latte");
        orderItem.setQuantity(2); // 2 cup x 18g = 36 gram
        order.getItems().add(orderItem);

        inventoryService.deductStockForOrder(order);

        // Stok awal 2000 - 36 = 1964
        assertEquals(new BigDecimal("1964.00"), coffeeBeans.getCurrentStock());
        verify(ingredientRepository).save(coffeeBeans);
        verify(stockMovementRepository).save(any(StockMovement.class));
    }
}
