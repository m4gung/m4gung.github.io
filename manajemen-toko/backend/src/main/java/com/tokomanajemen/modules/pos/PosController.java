package com.tokomanajemen.modules.pos;

import com.tokomanajemen.common.ApiResponse;
import com.tokomanajemen.modules.inventory.model.StockMutation;
import com.tokomanajemen.modules.inventory.repository.StockMutationRepository;
import com.tokomanajemen.modules.pos.dto.CheckoutRequest;
import com.tokomanajemen.modules.pos.model.Sale;
import com.tokomanajemen.modules.pos.model.SaleItem;
import com.tokomanajemen.modules.pos.repository.SaleItemRepository;
import com.tokomanajemen.modules.pos.repository.SaleRepository;
import com.tokomanajemen.modules.product.model.Product;
import com.tokomanajemen.modules.product.repository.ProductRepository;
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
@RequestMapping("/api/v1")
public class PosController {

    private final ProductRepository productRepository;
    private final SaleRepository saleRepository;
    private final SaleItemRepository saleItemRepository;
    private final StockMutationRepository stockMutationRepository;

    public PosController(ProductRepository productRepository,
                         SaleRepository saleRepository,
                         SaleItemRepository saleItemRepository,
                         StockMutationRepository stockMutationRepository) {
        this.productRepository = productRepository;
        this.saleRepository = saleRepository;
        this.saleItemRepository = saleItemRepository;
        this.stockMutationRepository = stockMutationRepository;
    }

    @PostMapping("/pos/checkout")
    @PreAuthorize("hasAnyRole('OWNER', 'CASHIER')")
    @Transactional
    public ResponseEntity<ApiResponse<Sale>> checkout(@Valid @RequestBody CheckoutRequest request,
                                                      Authentication authentication) {
        if (request.getItems() == null || request.getItems().isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Keranjang belanja kosong"));
        }

        String cashierId = (authentication != null) ? authentication.getName() : "CASHIER";
        String saleId = UUID.randomUUID().toString();

        // 1. Generate Nomor Faktur Unik jika belum disediakan
        String invoiceNo = request.getInvoiceNo();
        if (invoiceNo == null || invoiceNo.isBlank()) {
            String timestamp = DateTimeFormatter.ofPattern("yyyyMMddHHmmss").format(java.time.LocalDateTime.now());
            int randomSuffix = (int) (1000 + Math.random() * 9000);
            invoiceNo = "INV-" + timestamp + "-" + randomSuffix;
        }

        if (saleRepository.existsByInvoiceNo(invoiceNo)) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Nomor faktur '" + invoiceNo + "' sudah terdaftar"));
        }

        BigDecimal calculatedTotal = BigDecimal.ZERO;
        List<SaleItem> itemsToSave = new ArrayList<>();
        List<StockMutation> mutationsToSave = new ArrayList<>();

        // 2. Validasi & Hitung Ulang Setiap Item Menggunakan Data Aktual Database
        for (CheckoutRequest.CheckoutItemRequest itemReq : request.getItems()) {
            if (itemReq.getQuantity() <= 0) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Kuantitas barang harus lebih dari 0"));
            }

            Product product = productRepository.findById(itemReq.getProductId()).orElse(null);
            if (product == null || !product.isActive()) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Produk ID '" + itemReq.getProductId() + "' tidak ditemukan atau dinonaktifkan"));
            }

            // Cegah stok minus
            if (product.getStock() < itemReq.getQuantity()) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Stok tidak mencukupi untuk '" + product.getName() + "'. Sisa stok: " + product.getStock()));
            }

            // Kurangi stok produk secara transaksional
            product.setStock(product.getStock() - itemReq.getQuantity());
            product.setUpdatedAt(Instant.now());
            productRepository.save(product);

            // Hitung subtotal aktual di backend
            BigDecimal itemSubtotal = product.getSellingPrice().multiply(BigDecimal.valueOf(itemReq.getQuantity()));
            calculatedTotal = calculatedTotal.add(itemSubtotal);

            // Buat record SaleItem
            SaleItem saleItem = new SaleItem(
                    UUID.randomUUID().toString(),
                    saleId,
                    product.getId(),
                    product.getName(),
                    product.getCostPrice(),
                    product.getSellingPrice(),
                    itemReq.getQuantity(),
                    itemSubtotal
            );
            itemsToSave.add(saleItem);

            // Buat record Mutasi Stok (Audit)
            StockMutation mutation = new StockMutation(
                    "MUT-" + UUID.randomUUID().toString().substring(0, 8),
                    product.getId(),
                    product.getName(),
                    "OUT_SALE",
                    -itemReq.getQuantity(),
                    invoiceNo,
                    "Penjualan kasir POS",
                    cashierId
            );
            mutationsToSave.add(mutation);
        }

        // 3. Kalkulasi Diskon, Total Akhir, dan Kembalian di Sisi Server
        BigDecimal discount = request.getDiscountAmount();
        BigDecimal finalAmount = calculatedTotal.subtract(discount).max(BigDecimal.ZERO);
        BigDecimal cashReceived = request.getCashReceived();
        BigDecimal changeAmount = BigDecimal.ZERO;

        String paymentStatus = "PAID";
        if ("CASH".equalsIgnoreCase(request.getPaymentMethod())) {
            if (cashReceived.compareTo(finalAmount) < 0) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Uang tunai yang diterima kurang dari total pembayaran"));
            }
            changeAmount = cashReceived.subtract(finalAmount);
        } else if ("CREDIT".equalsIgnoreCase(request.getPaymentMethod())) {
            paymentStatus = "UNPAID";
        }

        // 4. Simpan Header Transaksi Penjualan
        Sale sale = new Sale(
                saleId,
                invoiceNo,
                request.getCustomerId(),
                calculatedTotal,
                discount,
                finalAmount,
                cashReceived,
                changeAmount,
                request.getPaymentMethod().toUpperCase(),
                paymentStatus,
                request.getNotes(),
                request.getDueDate(),
                cashierId
        );

        saleRepository.save(sale);
        saleItemRepository.saveAll(itemsToSave);
        stockMutationRepository.saveAll(mutationsToSave);

        sale.setItems(itemsToSave);

        return ResponseEntity.ok(ApiResponse.ok("Transaksi kasir berhasil diproses", sale));
    }

    @GetMapping("/sales")
    @PreAuthorize("hasAnyRole('OWNER', 'CASHIER')")
    public ResponseEntity<ApiResponse<List<Sale>>> getAllSales() {
        return ResponseEntity.ok(ApiResponse.ok(saleRepository.findAllByOrderByCreatedAtDesc()));
    }

    @GetMapping("/sales/{id}/items")
    @PreAuthorize("hasAnyRole('OWNER', 'CASHIER')")
    public ResponseEntity<ApiResponse<List<SaleItem>>> getSaleItems(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.ok(saleItemRepository.findBySaleId(id)));
    }
}
