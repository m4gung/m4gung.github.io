package com.cafe.modules.purchasing;

import com.cafe.common.TenantContext;
import com.cafe.modules.auth.Outlet;
import com.cafe.modules.auth.OutletRepository;
import com.cafe.modules.auth.Tenant;
import com.cafe.modules.auth.TenantRepository;
import com.cafe.modules.inventory.Ingredient;
import com.cafe.modules.inventory.IngredientRepository;
import com.cafe.modules.inventory.StockMovement;
import com.cafe.modules.inventory.StockMovementRepository;
import com.cafe.modules.purchasing.dto.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class PurchasingService {

    private final SupplierRepository supplierRepository;
    private final PurchaseRepository purchaseRepository;
    private final PurchaseItemRepository purchaseItemRepository;
    private final IngredientRepository ingredientRepository;
    private final StockMovementRepository stockMovementRepository;
    private final TenantRepository tenantRepository;
    private final OutletRepository outletRepository;

    public PurchasingService(
            SupplierRepository supplierRepository,
            PurchaseRepository purchaseRepository,
            PurchaseItemRepository purchaseItemRepository,
            IngredientRepository ingredientRepository,
            StockMovementRepository stockMovementRepository,
            TenantRepository tenantRepository,
            OutletRepository outletRepository) {
        this.supplierRepository = supplierRepository;
        this.purchaseRepository = purchaseRepository;
        this.purchaseItemRepository = purchaseItemRepository;
        this.ingredientRepository = ingredientRepository;
        this.stockMovementRepository = stockMovementRepository;
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

    // ================= SUPPLIERS =================
    @Transactional(readOnly = true)
    public List<SupplierDto> getSuppliers() {
        Long tenantId = getRequiredCurrentTenant().getId();
        return supplierRepository.findByTenantIdOrderByNameAsc(tenantId).stream()
                .map(this::mapSupplierToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public SupplierDto saveSupplier(SupplierDto dto) {
        Tenant tenant = getRequiredCurrentTenant();
        Supplier supplier;
        if (dto.getId() != null) {
            supplier = supplierRepository.findByIdAndTenantId(dto.getId(), tenant.getId())
                    .orElseThrow(() -> new IllegalArgumentException("Supplier tidak ditemukan"));
        } else {
            supplier = new Supplier();
            supplier.setTenant(tenant);
        }

        supplier.setName(dto.getName());
        supplier.setContactPerson(dto.getContactPerson());
        supplier.setPhone(dto.getPhone());
        supplier.setEmail(dto.getEmail());
        supplier.setAddress(dto.getAddress());
        supplier.setIsActive(dto.getIsActive() != null ? dto.getIsActive() : true);
        supplier.setUpdatedAt(Instant.now());

        Supplier saved = supplierRepository.save(supplier);
        return mapSupplierToDto(saved);
    }

    @Transactional
    public void deleteSupplier(Long id) {
        Long tenantId = getRequiredCurrentTenant().getId();
        Supplier supplier = supplierRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Supplier tidak ditemukan"));
        supplierRepository.delete(supplier);
    }

    // ================= PURCHASES =================
    @Transactional(readOnly = true)
    public List<PurchaseDto> getPurchases(Long outletId) {
        Long tenantId = getRequiredCurrentTenant().getId();
        List<Purchase> list;
        if (outletId != null) {
            list = purchaseRepository.findByTenantIdAndOutletIdOrderByPurchaseDateDesc(tenantId, outletId);
        } else {
            list = purchaseRepository.findByTenantIdOrderByPurchaseDateDesc(tenantId);
        }
        return list.stream().map(this::mapPurchaseToDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PurchaseDto getPurchaseById(Long id) {
        Long tenantId = getRequiredCurrentTenant().getId();
        Purchase purchase = purchaseRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Pembelian tidak ditemukan"));
        return mapPurchaseToDto(purchase);
    }

    @Transactional
    public PurchaseDto createPurchase(PurchaseDto dto) {
        Tenant tenant = getRequiredCurrentTenant();
        Outlet outlet = outletRepository.findByIdAndTenantId(dto.getOutletId(), tenant.getId())
                .orElseThrow(() -> new IllegalArgumentException("Outlet tidak ditemukan"));

        Purchase purchase = new Purchase();
        purchase.setTenant(tenant);
        purchase.setOutlet(outlet);
        purchase.setInvoiceNumber(dto.getInvoiceNumber());
        purchase.setPurchaseDate(dto.getPurchaseDate() != null ? dto.getPurchaseDate() : Instant.now());
        purchase.setPaymentStatus(dto.getPaymentStatus() != null ? dto.getPaymentStatus() : "PAID");
        purchase.setPaymentMethod(dto.getPaymentMethod() != null ? dto.getPaymentMethod() : "CASH");
        purchase.setStatus(dto.getStatus() != null ? dto.getStatus() : "RECEIVED");
        purchase.setNotes(dto.getNotes());

        if (dto.getSupplierId() != null) {
            Supplier supplier = supplierRepository.findByIdAndTenantId(dto.getSupplierId(), tenant.getId())
                    .orElse(null);
            purchase.setSupplier(supplier);
        }

        BigDecimal calculatedTotal = BigDecimal.ZERO;
        List<PurchaseItem> items = new ArrayList<>();

        for (PurchaseItemDto itemDto : dto.getItems()) {
            Ingredient ingredient = ingredientRepository.findByIdAndTenantId(itemDto.getIngredientId(), tenant.getId())
                    .orElseThrow(() -> new IllegalArgumentException("Bahan baku tidak ditemukan: " + itemDto.getIngredientId()));

            PurchaseItem item = new PurchaseItem();
            item.setPurchase(purchase);
            item.setIngredient(ingredient);
            item.setQuantity(itemDto.getQuantity());
            item.setUnitCost(itemDto.getUnitCost());

            BigDecimal subtotal = itemDto.getQuantity().multiply(itemDto.getUnitCost()).setScale(2, java.math.RoundingMode.HALF_UP);
            item.setSubtotal(subtotal);
            calculatedTotal = calculatedTotal.add(subtotal);
            items.add(item);

            // Auto increase stock if purchase status is RECEIVED
            if ("RECEIVED".equalsIgnoreCase(purchase.getStatus())) {
                BigDecimal stockBefore = ingredient.getCurrentStock() != null ? ingredient.getCurrentStock() : BigDecimal.ZERO;
                BigDecimal stockAfter = stockBefore.add(itemDto.getQuantity()).setScale(2, java.math.RoundingMode.HALF_UP);

                ingredient.setCurrentStock(stockAfter);
                ingredient.setCostPerUnit(itemDto.getUnitCost()); // update latest purchase cost
                ingredientRepository.save(ingredient);

                // Audit trail
                StockMovement movement = new StockMovement();
                movement.setTenant(tenant);
                movement.setOutlet(outlet);
                movement.setIngredient(ingredient);
                movement.setMovementType("PURCHASE");
                movement.setQuantityChange(itemDto.getQuantity());
                movement.setStockBefore(stockBefore);
                movement.setStockAfter(stockAfter);
                movement.setReferenceId(purchase.getInvoiceNumber());
                movement.setNotes("Pembelian masuk faktur #" + purchase.getInvoiceNumber() +
                        (purchase.getSupplier() != null ? " (" + purchase.getSupplier().getName() + ")" : ""));
                stockMovementRepository.save(movement);
            }
        }

        purchase.setTotalAmount(calculatedTotal.setScale(2, java.math.RoundingMode.HALF_UP));
        purchase.setItems(items);

        Purchase saved = purchaseRepository.save(purchase);
        return mapPurchaseToDto(saved);
    }

    // ================= MAPPERS =================
    private SupplierDto mapSupplierToDto(Supplier supplier) {
        SupplierDto dto = new SupplierDto();
        dto.setId(supplier.getId());
        dto.setName(supplier.getName());
        dto.setContactPerson(supplier.getContactPerson());
        dto.setPhone(supplier.getPhone());
        dto.setEmail(supplier.getEmail());
        dto.setAddress(supplier.getAddress());
        dto.setIsActive(supplier.getIsActive());
        dto.setCreatedAt(supplier.getCreatedAt());
        return dto;
    }

    private PurchaseDto mapPurchaseToDto(Purchase purchase) {
        PurchaseDto dto = new PurchaseDto();
        dto.setId(purchase.getId());
        dto.setOutletId(purchase.getOutlet().getId());
        if (purchase.getSupplier() != null) {
            dto.setSupplierId(purchase.getSupplier().getId());
            dto.setSupplierName(purchase.getSupplier().getName());
        }
        dto.setInvoiceNumber(purchase.getInvoiceNumber());
        dto.setPurchaseDate(purchase.getPurchaseDate());
        dto.setTotalAmount(purchase.getTotalAmount());
        dto.setPaymentStatus(purchase.getPaymentStatus());
        dto.setPaymentMethod(purchase.getPaymentMethod());
        dto.setStatus(purchase.getStatus());
        dto.setNotes(purchase.getNotes());
        dto.setCreatedAt(purchase.getCreatedAt());

        if (purchase.getItems() != null) {
            dto.setItems(purchase.getItems().stream().map(item -> {
                PurchaseItemDto itemDto = new PurchaseItemDto();
                itemDto.setId(item.getId());
                itemDto.setIngredientId(item.getIngredient().getId());
                itemDto.setIngredientName(item.getIngredient().getName());
                itemDto.setUnit(item.getIngredient().getUnit());
                itemDto.setQuantity(item.getQuantity());
                itemDto.setUnitCost(item.getUnitCost());
                itemDto.setSubtotal(item.getSubtotal());
                return itemDto;
            }).collect(Collectors.toList()));
        }
        return dto;
    }
}
