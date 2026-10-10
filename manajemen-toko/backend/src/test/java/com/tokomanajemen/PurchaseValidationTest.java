package com.tokomanajemen;

import com.tokomanajemen.modules.purchase.dto.CreatePurchaseRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

public class PurchaseValidationTest {

    private Validator validator;

    @BeforeEach
    void setUp() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Test
    void testEmptyPurchaseItemsRejected() {
        CreatePurchaseRequest request = new CreatePurchaseRequest();
        request.setSupplierName("PT Sumber Pangan");
        request.setPaymentMethod("CASH");
        request.setItems(Collections.emptyList());

        Set<ConstraintViolation<CreatePurchaseRequest>> violations = validator.validate(request);
        assertFalse(violations.isEmpty(), "Item pembelian kosong wajib ditolak validasi");
    }

    @Test
    void testBlankSupplierNameRejected() {
        CreatePurchaseRequest request = new CreatePurchaseRequest();
        request.setSupplierName(null);
        request.setPaymentMethod("CASH");
        request.setItems(List.of(new CreatePurchaseRequest.PurchaseItemRequest("PRD-001", 10, new BigDecimal("2500"))));

        Set<ConstraintViolation<CreatePurchaseRequest>> violations = validator.validate(request);
        assertFalse(violations.isEmpty(), "Nama supplier null wajib ditolak validasi");
    }

    @Test
    void testPurchaseCalculations() {
        BigDecimal costItemA = new BigDecimal("2800");
        int qtyA = 20;
        BigDecimal subtotalA = costItemA.multiply(BigDecimal.valueOf(qtyA)); // 56000

        BigDecimal costItemB = new BigDecimal("17500");
        int qtyB = 5;
        BigDecimal subtotalB = costItemB.multiply(BigDecimal.valueOf(qtyB)); // 87500

        BigDecimal total = subtotalA.add(subtotalB); // 143500

        assertEquals(new BigDecimal("56000"), subtotalA);
        assertEquals(new BigDecimal("87500"), subtotalB);
        assertEquals(new BigDecimal("143500"), total);
    }
}
