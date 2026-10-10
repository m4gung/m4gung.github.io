package com.tokomanajemen.modules.purchase;

import com.tokomanajemen.common.ApiResponse;
import com.tokomanajemen.modules.inventory.model.StockMutation;
import com.tokomanajemen.modules.inventory.repository.StockMutationRepository;
import com.tokomanajemen.modules.product.model.Product;
import com.tokomanajemen.modules.product.repository.ProductRepository;
import com.tokomanajemen.modules.purchase.dto.CreatePurchaseRequest;
import com.tokomanajemen.modules.purchase.model.Purchase;
import com.tokomanajemen.modules.purchase.model.PurchaseItem;
import com.tokomanajemen.modules.purchase.repository.PurchaseItemRepository;
import com.tokomanajemen.modules.purchase.repository.PurchaseRepository;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/purchases")
public class PurchaseController {

    private final ProductRepository productRepository;
    private final PurchaseRepository purchaseRepository;
    private final PurchaseItemRepository purchaseItemRepository;
    private final StockMutationRepository stockMutationRepository;

    public PurchaseController(ProductRepository productRepository,
                              PurchaseRepository purchaseRepository,
                              PurchaseItemRepository purchaseItemRepository,
                              StockMutationRepository stockMutationRepository) {
        this.productRepository = productRepository;
        this.purchaseRepository = purchaseRepository;
        this.purchaseItemRepository = purchaseItemRepository;
        this.stockMutationRepository = stockMutationRepository;
    }

    @PostMapping
    @PreAuthorize("hasRole('OWNER')")
    @Transactional
    public ResponseEntity<ApiResponse<Purchase>> createPurchase(@Valid @RequestBody CreatePurchaseRequest request,
                                                               Authentication authentication) {
        if (request.getItems() == null || request.getItems().isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Daftar barang pembelian tidak boleh kosong"));
        }

        String operator = (authentication != null) ? authentication.getName() : "OWNER";
        String purchaseId = UUID.randomUUID().toString();

        // 1. Generate Nomor Faktur Pembelian Unik
        String purchaseNo = request.getPurchaseNo();
        if (purchaseNo == null || purchaseNo.isBlank()) {
            String timestamp = DateTimeFormatter.ofPattern("yyyyMMddHHmmss").format(java.time.LocalDateTime.now());
            int randomSuffix = (int) (1000 + Math.random() * 9000);
            purchaseNo = "PO-" + timestamp + "-" + randomSuffix;
        }

        if (purchaseRepository.existsByPurchaseNo(purchaseNo)) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Nomor pembelian '" + purchaseNo + "' sudah terdaftar"));
        }

        BigDecimal calculatedTotal = BigDecimal.ZERO;
        List<PurchaseItem> itemsToSave = new ArrayList<>();
        List<StockMutation> mutationsToSave = new ArrayList<>();

        // 2. Tambah Stok Produk & Buat Mutasi Masuk
        for (CreatePurchaseRequest.PurchaseItemRequest itemReq : request.getItems()) {
            if (itemReq.getQuantity() <= 0) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Kuantitas barang harus lebih dari 0"));
            }

            Product product = productRepository.findById(itemReq.getProductId()).orElse(null);
            if (product == null) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Produk ID '" + itemReq.getProductId() + "' tidak ditemukan"));
            }

            // Tambah stok fisik barang
            product.setStock(product.getStock() + itemReq.getQuantity());
            if (itemReq.getCostPrice() != null && itemReq.getCostPrice().compareTo(BigDecimal.ZERO) > 0) {
                product.setCostPrice(itemReq.getCostPrice()); // update modal terbaru
            }
            product.setUpdatedAt(Instant.now());
            productRepository.save(product);

            BigDecimal itemCost = itemReq.getCostPrice() != null ? itemReq.getCostPrice() : product.getCostPrice();
            BigDecimal subtotal = itemCost.multiply(BigDecimal.valueOf(itemReq.getQuantity()));
            calculatedTotal = calculatedTotal.add(subtotal);

            // Simpan detail PurchaseItem
            PurchaseItem purchaseItem = new PurchaseItem(
                    UUID.randomUUID().toString(),
                    purchaseId,
                    product.getId(),
                    product.getName(),
                    itemReq.getQuantity(),
                    itemCost,
                    subtotal
            );
            itemsToSave.add(purchaseItem);

            // Simpan mutasi masuk IN_PURCHASE
            StockMutation mutation = new StockMutation(
                    "MUT-" + UUID.randomUUID().toString().substring(0, 8),
                    product.getId(),
                    product.getName(),
                    "IN_PURCHASE",
                    itemReq.getQuantity(),
                    purchaseNo,
                    "Pengadaan barang dari " + request.getSupplierName(),
                    operator
            );
            mutationsToSave.add(mutation);
        }

        // 3. Simpan Header Pembelian
        Purchase purchase = new Purchase(
                purchaseId,
                purchaseNo,
                request.getSupplierId(),
                request.getSupplierName(),
                calculatedTotal,
                request.getPaymentMethod().toUpperCase(),
                request.getPaymentStatus() != null ? request.getPaymentStatus().toUpperCase() : "PAID",
                request.getDueDate(),
                request.getNotes(),
                operator
        );

        purchaseRepository.save(purchase);
        purchaseItemRepository.saveAll(itemsToSave);
        stockMutationRepository.saveAll(mutationsToSave);

        purchase.setItems(itemsToSave);

        return ResponseEntity.ok(ApiResponse.ok("Transaksi pembelian berhasil dicatat & stok bertambah", purchase));
    }

    @GetMapping
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<ApiResponse<List<Purchase>>> getAllPurchases() {
        return ResponseEntity.ok(ApiResponse.ok(purchaseRepository.findAllByOrderByCreatedAtDesc()));
    }

    @GetMapping("/{id}/items")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<ApiResponse<List<PurchaseItem>>> getPurchaseItems(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.ok(purchaseItemRepository.findByPurchaseId(id)));
    }
}
