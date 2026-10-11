package com.cafe.modules.inventory;

import com.cafe.common.TenantContext;
import com.cafe.modules.auth.Tenant;
import com.cafe.modules.auth.TenantRepository;
import com.cafe.modules.inventory.dto.*;
import com.cafe.modules.master.Product;
import com.cafe.modules.master.ProductRepository;
import com.cafe.modules.pos.Order;
import com.cafe.modules.pos.OrderItem;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class InventoryService {

    private final IngredientRepository ingredientRepository;
    private final RecipeRepository recipeRepository;
    private final RecipeItemRepository recipeItemRepository;
    private final StockMovementRepository stockMovementRepository;
    private final TenantRepository tenantRepository;
    private final ProductRepository productRepository;

    public InventoryService(
            IngredientRepository ingredientRepository,
            RecipeRepository recipeRepository,
            RecipeItemRepository recipeItemRepository,
            StockMovementRepository stockMovementRepository,
            TenantRepository tenantRepository,
            ProductRepository productRepository) {
        this.ingredientRepository = ingredientRepository;
        this.recipeRepository = recipeRepository;
        this.recipeItemRepository = recipeItemRepository;
        this.stockMovementRepository = stockMovementRepository;
        this.tenantRepository = tenantRepository;
        this.productRepository = productRepository;
    }

    private Tenant getRequiredCurrentTenant() {
        Long tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            throw new IllegalArgumentException("Tenant context tidak ditemukan");
        }
        return tenantRepository.findById(tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Tenant tidak ditemukan"));
    }

    // ================= INGREDIENTS =================
    @Transactional(readOnly = true)
    public List<IngredientDto> getIngredients() {
        Long tenantId = getRequiredCurrentTenant().getId();
        return ingredientRepository.findByTenantIdOrderByNameAsc(tenantId).stream()
                .map(this::mapIngredientToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public IngredientDto saveIngredient(IngredientDto dto) {
        Tenant tenant = getRequiredCurrentTenant();
        Ingredient ingredient;

        if (dto.getId() != null) {
            ingredient = ingredientRepository.findByIdAndTenantId(dto.getId(), tenant.getId())
                    .orElseThrow(() -> new IllegalArgumentException("Bahan baku tidak ditemukan"));
        } else {
            ingredient = new Ingredient();
            ingredient.setTenant(tenant);
        }

        BigDecimal beforeStock = ingredient.getCurrentStock() != null ? ingredient.getCurrentStock() : BigDecimal.ZERO;
        BigDecimal newStock = dto.getCurrentStock() != null ? dto.getCurrentStock() : BigDecimal.ZERO;

        ingredient.setName(dto.getName().trim());
        ingredient.setUnit(dto.getUnit().trim().toUpperCase());
        ingredient.setCostPerUnit(dto.getCostPerUnit() != null ? dto.getCostPerUnit() : BigDecimal.ZERO);
        ingredient.setMinimumStock(dto.getMinimumStock() != null ? dto.getMinimumStock() : BigDecimal.ZERO);
        ingredient.setCurrentStock(newStock);
        ingredient.setIsActive(dto.getIsActive() != null ? dto.getIsActive() : true);
        ingredient.setUpdatedAt(Instant.now());

        ingredient = ingredientRepository.save(ingredient);

        // Record Initial Stock Movement if newly created
        if (dto.getId() == null && newStock.compareTo(BigDecimal.ZERO) > 0) {
            recordStockMovement(
                    tenant,
                    ingredient,
                    "INITIAL",
                    newStock,
                    BigDecimal.ZERO,
                    newStock,
                    "INIT-" + ingredient.getId(),
                    "Saldo stok awal bahan"
            );
        }

        return mapIngredientToDto(ingredient);
    }

    @Transactional
    public void deleteIngredient(Long id) {
        Long tenantId = getRequiredCurrentTenant().getId();
        Ingredient ingredient = ingredientRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Bahan baku tidak ditemukan"));
        ingredientRepository.delete(ingredient);
    }

    // ================= RECIPES (BOM) =================
    @Transactional(readOnly = true)
    public List<RecipeDto> getRecipes() {
        Long tenantId = getRequiredCurrentTenant().getId();
        return recipeRepository.findByTenantId(tenantId).stream()
                .map(this::mapRecipeToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Optional<RecipeDto> getRecipeByProductId(Long productId) {
        Long tenantId = getRequiredCurrentTenant().getId();
        return recipeRepository.findByProductIdAndTenantId(productId, tenantId)
                .map(this::mapRecipeToDto);
    }

    @Transactional
    public RecipeDto saveRecipe(RecipeDto dto) {
        Tenant tenant = getRequiredCurrentTenant();
        Product product = productRepository.findByIdAndTenantId(dto.getProductId(), tenant.getId())
                .orElseThrow(() -> new IllegalArgumentException("Produk tidak ditemukan"));

        Recipe recipe = recipeRepository.findByProductIdAndTenantId(product.getId(), tenant.getId())
                .orElse(new Recipe(tenant, product, dto.getNotes()));

        recipe.setNotes(dto.getNotes());
        recipe.setUpdatedAt(Instant.now());
        recipe.getItems().clear();

        if (dto.getItems() != null) {
            for (RecipeDto.RecipeItemDto itemDto : dto.getItems()) {
                Ingredient ingredient = ingredientRepository.findByIdAndTenantId(itemDto.getIngredientId(), tenant.getId())
                        .orElseThrow(() -> new IllegalArgumentException("Bahan ID " + itemDto.getIngredientId() + " tidak valid"));

                RecipeItem recipeItem = new RecipeItem(recipe, ingredient, itemDto.getQuantity());
                recipe.getItems().add(recipeItem);
            }
        }

        recipe = recipeRepository.save(recipe);
        return mapRecipeToDto(recipe);
    }

    // ================= STOCK ADJUSTMENT (MANUAL / SPOILED / OPNAME) =================
    @Transactional
    public StockMovementDto adjustStock(StockAdjustmentRequest request) {
        Tenant tenant = getRequiredCurrentTenant();
        Ingredient ingredient = ingredientRepository.findByIdAndTenantId(request.getIngredientId(), tenant.getId())
                .orElseThrow(() -> new IllegalArgumentException("Bahan baku tidak ditemukan"));

        BigDecimal stockBefore = ingredient.getCurrentStock();
        BigDecimal change = request.getQuantityChange();
        BigDecimal stockAfter = stockBefore.add(change);

        if (stockAfter.compareTo(BigDecimal.ZERO) < 0) {
            stockAfter = BigDecimal.ZERO;
        }

        ingredient.setCurrentStock(stockAfter);
        ingredient.setUpdatedAt(Instant.now());
        ingredientRepository.save(ingredient);

        StockMovement movement = recordStockMovement(
                tenant,
                ingredient,
                request.getMovementType() != null ? request.getMovementType() : "ADJUSTMENT",
                change,
                stockBefore,
                stockAfter,
                "ADJ-" + System.currentTimeMillis(),
                request.getNotes()
        );

        return mapStockMovementToDto(movement);
    }

    // ================= ATOMIC STOCK DEDUCTION FOR POS ORDERS =================
    @Transactional
    public void deductStockForOrder(Order order) {
        Tenant tenant = order.getTenant();

        for (OrderItem orderItem : order.getItems()) {
            if (orderItem.getProduct() == null) continue;

            Optional<Recipe> recipeOpt = recipeRepository.findByProductId(orderItem.getProduct().getId());
            if (recipeOpt.isPresent()) {
                Recipe recipe = recipeOpt.get();
                for (RecipeItem recipeItem : recipe.getItems()) {
                    Ingredient ingredient = recipeItem.getIngredient();
                    BigDecimal perItemQty = recipeItem.getQuantity();
                    BigDecimal totalNeeded = perItemQty.multiply(BigDecimal.valueOf(orderItem.getQuantity()));

                    BigDecimal before = ingredient.getCurrentStock();
                    BigDecimal after = before.subtract(totalNeeded);

                    ingredient.setCurrentStock(after);
                    ingredient.setUpdatedAt(Instant.now());
                    ingredientRepository.save(ingredient);

                    recordStockMovement(
                            tenant,
                            ingredient,
                            "SALE",
                            totalNeeded.negate(),
                            before,
                            after,
                            order.getOrderNumber(),
                            "Penjualan POS " + orderItem.getQuantity() + "x " + orderItem.getProductNameSnapshot()
                    );
                }
            }
        }
    }

    @Transactional(readOnly = true)
    public List<StockMovementDto> getStockMovements(Long ingredientId) {
        Long tenantId = getRequiredCurrentTenant().getId();
        List<StockMovement> list = (ingredientId != null) ?
                stockMovementRepository.findByTenantIdAndIngredientIdOrderByCreatedAtDesc(tenantId, ingredientId) :
                stockMovementRepository.findByTenantIdOrderByCreatedAtDesc(tenantId);

        return list.stream().map(this::mapStockMovementToDto).collect(Collectors.toList());
    }

    private StockMovement recordStockMovement(
            Tenant tenant,
            Ingredient ingredient,
            String movementType,
            BigDecimal change,
            BigDecimal before,
            BigDecimal after,
            String referenceId,
            String notes) {
        StockMovement sm = new StockMovement();
        sm.setTenant(tenant);
        sm.setIngredient(ingredient);
        sm.setMovementType(movementType);
        sm.setQuantityChange(change);
        sm.setStockBefore(before);
        sm.setStockAfter(after);
        sm.setReferenceNumber(referenceId);
        sm.setNotes(notes);
        return stockMovementRepository.save(sm);
    }

    private IngredientDto mapIngredientToDto(Ingredient i) {
        return new IngredientDto(
                i.getId(),
                i.getName(),
                i.getUnit(),
                i.getCostPerUnit(),
                i.getMinimumStock(),
                i.getCurrentStock(),
                i.getIsActive()
        );
    }

    private RecipeDto mapRecipeToDto(Recipe r) {
        RecipeDto dto = new RecipeDto();
        dto.setId(r.getId());
        dto.setProductId(r.getProduct().getId());
        dto.setProductName(r.getProduct().getName());
        dto.setNotes(r.getNotes());

        BigDecimal totalCost = BigDecimal.ZERO;
        List<RecipeDto.RecipeItemDto> itemDtos = new ArrayList<>();

        for (RecipeItem item : r.getItems()) {
            Ingredient ing = item.getIngredient();
            BigDecimal costPerUnit = ing.getCostPerUnit() != null ? ing.getCostPerUnit() : BigDecimal.ZERO;
            BigDecimal subCost = costPerUnit.multiply(item.getQuantity());
            totalCost = totalCost.add(subCost);

            itemDtos.add(new RecipeDto.RecipeItemDto(
                    item.getId(),
                    ing.getId(),
                    ing.getName(),
                    ing.getUnit(),
                    item.getQuantity(),
                    costPerUnit,
                    subCost
            ));
        }

        dto.setEstimatedCost(totalCost);
        dto.setItems(itemDtos);
        return dto;
    }

    private StockMovementDto mapStockMovementToDto(StockMovement sm) {
        return new StockMovementDto(
                sm.getId(),
                sm.getIngredient().getId(),
                sm.getIngredient().getName(),
                sm.getIngredient().getUnit(),
                sm.getMovementType(),
                sm.getQuantityChange(),
                sm.getStockBefore(),
                sm.getStockAfter(),
                sm.getReferenceNumber(),
                sm.getNotes(),
                sm.getCreatedAt()
        );
    }
}
