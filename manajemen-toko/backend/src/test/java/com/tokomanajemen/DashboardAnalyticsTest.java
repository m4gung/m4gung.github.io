package com.tokomanajemen;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;

class DashboardAnalyticsTest {

    record SaleRecord(String invoiceNo, LocalDate date, BigDecimal finalAmount, List<ItemRecord> items) {}
    record ItemRecord(String productName, int quantity, BigDecimal costPrice, BigDecimal sellingPrice) {}

    @Test
    @DisplayName("Kalkulasi valuasi total nilai persediaan stok toko harus akurat")
    void shouldCalculateTotalInventoryValuationAccurately() {
        record ProductStock(String name, int stock, BigDecimal costPrice) {}

        List<ProductStock> inventory = List.of(
                new ProductStock("Beras 5kg", 20, new BigDecimal("65000.00")),
                new ProductStock("Minyak 2L", 15, new BigDecimal("32000.00")),
                new ProductStock("Gula 1kg", 30, new BigDecimal("14000.00"))
        );

        BigDecimal totalValuation = inventory.stream()
                .map(p -> p.costPrice().multiply(BigDecimal.valueOf(p.stock())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // (20 * 65.000 = 1.300.000) + (15 * 32.000 = 480.000) + (30 * 14.000 = 420.000) = 2.200.000
        assertEquals(new BigDecimal("2200000.00"), totalValuation);
    }

    @Test
    @DisplayName("Kalkulasi omzet penjualan harian dan agregasi bulanan")
    void shouldCalculateDailyAndMonthlySalesRevenue() {
        LocalDate today = LocalDate.now();
        LocalDate yesterday = today.minusDays(1);

        List<SaleRecord> sales = List.of(
                new SaleRecord("INV-01", today, new BigDecimal("150000.00"), List.of()),
                new SaleRecord("INV-02", today, new BigDecimal("350000.00"), List.of()),
                new SaleRecord("INV-03", yesterday, new BigDecimal("200000.00"), List.of())
        );

        BigDecimal todayRevenue = sales.stream()
                .filter(s -> s.date().equals(today))
                .map(SaleRecord::finalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalRevenue = sales.stream()
                .map(SaleRecord::finalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        assertEquals(new BigDecimal("500000.00"), todayRevenue);
        assertEquals(new BigDecimal("700000.00"), totalRevenue);
    }

    @Test
    @DisplayName("Perhitungan perangkingan produk terlaris (Top Selling Products)")
    void shouldAggregateTopSellingProducts() {
        List<ItemRecord> itemsSold = List.of(
                new ItemRecord("Indomie Goreng", 10, new BigDecimal("2500"), new BigDecimal("3100")),
                new ItemRecord("Beras 5kg", 2, new BigDecimal("65000"), new BigDecimal("72000")),
                new ItemRecord("Indomie Goreng", 15, new BigDecimal("2500"), new BigDecimal("3100")),
                new ItemRecord("Minyak 2L", 5, new BigDecimal("32000"), new BigDecimal("36000"))
        );

        Map<String, Integer> totalQtyPerProduct = itemsSold.stream()
                .collect(Collectors.groupingBy(
                        ItemRecord::productName,
                        Collectors.summingInt(ItemRecord::quantity)
                ));

        assertEquals(25, totalQtyPerProduct.get("Indomie Goreng"));
        assertEquals(2, totalQtyPerProduct.get("Beras 5kg"));
        assertEquals(5, totalQtyPerProduct.get("Minyak 2L"));
    }
}
