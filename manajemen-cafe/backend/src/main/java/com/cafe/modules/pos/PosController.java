package com.cafe.modules.pos;

import com.cafe.common.ApiResponse;
import com.cafe.modules.pos.dto.CreateOrderRequest;
import com.cafe.modules.pos.dto.OrderResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/pos")
public class PosController {

    private final PosService posService;

    public PosController(PosService posService) {
        this.posService = posService;
    }

    @PostMapping("/orders")
    public ResponseEntity<ApiResponse<OrderResponse>> createOrder(@Valid @RequestBody CreateOrderRequest request) {
        OrderResponse response = posService.createAndProcessOrder(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Transaksi berhasil diproses"));
    }

    @GetMapping("/orders")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getOrders(@RequestParam(required = false) Long outletId) {
        List<OrderResponse> orders = posService.getOrders(outletId);
        return ResponseEntity.ok(ApiResponse.success(orders, "Riwayat pesanan berhasil dimuat"));
    }

    @GetMapping("/orders/{id}")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrderById(@PathVariable Long id) {
        OrderResponse order = posService.getOrderById(id);
        return ResponseEntity.ok(ApiResponse.success(order, "Detail pesanan berhasil dimuat"));
    }

    @PostMapping("/orders/{id}/void")
    public ResponseEntity<ApiResponse<OrderResponse>> voidOrder(
            @PathVariable Long id,
            @RequestParam(required = false, defaultValue = "Pembatalan oleh kasir/manager") String reason) {
        OrderResponse order = posService.voidOrder(id, reason);
        return ResponseEntity.ok(ApiResponse.success(order, "Pesanan berhasil dibatalkan (VOID)"));
    }
}
