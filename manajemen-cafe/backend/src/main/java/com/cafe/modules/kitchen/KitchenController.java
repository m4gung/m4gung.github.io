package com.cafe.modules.kitchen;

import com.cafe.common.ApiResponse;
import com.cafe.modules.pos.dto.OrderResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/kitchen")
public class KitchenController {

    private final KitchenService kitchenService;

    public KitchenController(KitchenService kitchenService) {
        this.kitchenService = kitchenService;
    }

    @GetMapping("/orders")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getActiveOrders(@RequestParam(required = false) Long outletId) {
        List<OrderResponse> orders = kitchenService.getActiveKitchenOrders(outletId);
        return ResponseEntity.ok(ApiResponse.success(orders, "Antrean pesanan dapur berhasil dimuat"));
    }

    @PatchMapping("/orders/{id}/status")
    public ResponseEntity<ApiResponse<OrderResponse>> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload) {
        String status = payload.get("status");
        if (status == null || status.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Field 'status' wajib diisi"));
        }
        OrderResponse updated = kitchenService.updateOrderStatus(id, status);
        return ResponseEntity.ok(ApiResponse.success(updated, "Status pesanan berhasil diperbarui"));
    }
}
