package com.tokomanajemen;

import com.tokomanajemen.modules.inventory.dto.StockAdjustmentRequest;
import com.tokomanajemen.modules.product.model.Product;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

public class ProductValidationTest {

    private Validator validator;

    @BeforeEach
    void setUp() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Test
    void testValidProduct() {
        Product product = new Product(
                "PRD-001",
                "SKU-TEST",
                "123456789",
                "Minyak Goreng 1L",
                "Sembako",
                "Pouch",
                new BigDecimal("15000"),
                new BigDecimal("18000"),
                50,
                10
        );

        Set<ConstraintViolation<Product>> violations = validator.validate(product);
        assertTrue(violations.isEmpty(), "Produk valid tidak boleh menghasilkan pelanggaran validasi");
    }

    @Test
    void testPreventNegativeStockInAdjustment() {
        StockAdjustmentRequest req = new StockAdjustmentRequest("PRD-001", -5, "RUSAK", "Barang pecah");
        Set<ConstraintViolation<StockAdjustmentRequest>> violations = validator.validate(req);
        assertFalse(violations.isEmpty(), "Penyesuaian stok bernilai negatif wajib ditolak validasi");
    }

    @Test
    void testBlankSkuRejected() {
        Product product = new Product(
                "PRD-002",
                "",
                "123456789",
                "Beras 5kg",
                "Sembako",
                "Karung",
                new BigDecimal("60000"),
                new BigDecimal("70000"),
                10,
                2
        );

        Set<ConstraintViolation<Product>> violations = validator.validate(product);
        assertFalse(violations.isEmpty(), "SKU kosong wajib ditolak validasi");
    }
}
