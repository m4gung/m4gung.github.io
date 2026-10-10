package com.tokomanajemen;

import com.tokomanajemen.modules.pos.dto.CheckoutRequest;
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

public class PosCheckoutTest {

    private Validator validator;

    @BeforeEach
    void setUp() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Test
    void testCheckoutCalculations() {
        BigDecimal priceItemA = new BigDecimal("3500");
        int qtyA = 3;
        BigDecimal subtotalA = priceItemA.multiply(BigDecimal.valueOf(qtyA)); // 10500

        BigDecimal priceItemB = new BigDecimal("20000");
        int qtyB = 1;
        BigDecimal subtotalB = priceItemB.multiply(BigDecimal.valueOf(qtyB)); // 20000

        BigDecimal total = subtotalA.add(subtotalB); // 30500
        BigDecimal discount = new BigDecimal("500");
        BigDecimal finalAmount = total.subtract(discount); // 30000

        BigDecimal cashReceived = new BigDecimal("50000");
        BigDecimal change = cashReceived.subtract(finalAmount); // 20000

        assertEquals(new BigDecimal("30500"), total);
        assertEquals(new BigDecimal("30000"), finalAmount);
        assertEquals(new BigDecimal("20000"), change);
    }

    @Test
    void testEmptyCartRejected() {
        CheckoutRequest request = new CheckoutRequest();
        request.setPaymentMethod("CASH");
        request.setItems(Collections.emptyList());

        Set<ConstraintViolation<CheckoutRequest>> violations = validator.validate(request);
        assertFalse(violations.isEmpty(), "Keranjang belanja kosong wajib ditolak validasi");
    }

    @Test
    void testValidCheckoutRequest() {
        CheckoutRequest request = new CheckoutRequest();
        request.setPaymentMethod("QRIS");
        request.setItems(List.of(new CheckoutRequest.CheckoutItemRequest("PRD-001", 2)));

        Set<ConstraintViolation<CheckoutRequest>> violations = validator.validate(request);
        assertTrue(violations.isEmpty(), "Request checkout valid harus lolos validasi");
    }
}
