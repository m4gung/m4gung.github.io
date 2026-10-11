package com.cafe.modules.kitchen;

import com.cafe.common.TenantContext;
import com.cafe.modules.master.DiningTable;
import com.cafe.modules.master.DiningTableRepository;
import com.cafe.modules.pos.Order;
import com.cafe.modules.pos.OrderRepository;
import com.cafe.modules.pos.dto.OrderResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class KitchenService {

    private final OrderRepository orderRepository;
    private final DiningTableRepository diningTableRepository;

    public KitchenService(OrderRepository orderRepository, DiningTableRepository diningTableRepository) {
        this.orderRepository = orderRepository;
        this.diningTableRepository = diningTableRepository;
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getActiveKitchenOrders(Long outletId) {
        Long tenantId = TenantContext.getTenantId();
        Long effectiveOutlet = outletId != null ? outletId : TenantContext.getOutletId();

        List<Order> allOrders = orderRepository.findByTenantIdAndOutletIdOrderByCreatedAtDesc(tenantId, effectiveOutlet);

        // Filter orders that are in kitchen flow: PAID, IN_PREPARATION, READY
        return allOrders.stream()
                .filter(o -> "PAID".equalsIgnoreCase(o.getStatus()) ||
                        "IN_PREPARATION".equalsIgnoreCase(o.getStatus()) ||
                        "READY".equalsIgnoreCase(o.getStatus()))
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public OrderResponse updateOrderStatus(Long orderId, String newStatus) {
        Long tenantId = TenantContext.getTenantId();
        Order order = orderRepository.findByIdAndTenantId(orderId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Pesanan tidak ditemukan"));

        String sanitizedStatus = newStatus.trim().toUpperCase();

        // Validasi transisi status
        if (!isValidStatus(sanitizedStatus)) {
            throw new IllegalArgumentException("Status pesanan '" + sanitizedStatus + "' tidak valid");
        }

        order.setStatus(sanitizedStatus);
        order.setUpdatedAt(Instant.now());

        // Jika pesanan selesai atau dibatalkan, dan pesanan Dine-In dengan meja, kembalikan status meja menjadi AVAILABLE
        if (("COMPLETED".equalsIgnoreCase(sanitizedStatus) || "CANCELLED".equalsIgnoreCase(sanitizedStatus)) && order.getTable() != null) {
            DiningTable table = order.getTable();
            table.setStatus("AVAILABLE");
            diningTableRepository.save(table);
        }

        order = orderRepository.save(order);
        return mapToResponse(order);
    }

    private boolean isValidStatus(String status) {
        return "PAID".equalsIgnoreCase(status) ||
                "IN_PREPARATION".equalsIgnoreCase(status) ||
                "READY".equalsIgnoreCase(status) ||
                "COMPLETED".equalsIgnoreCase(status) ||
                "CANCELLED".equalsIgnoreCase(status);
    }

    private OrderResponse mapToResponse(Order order) {
        OrderResponse resp = new OrderResponse();
        resp.setId(order.getId());
        resp.setOrderNumber(order.getOrderNumber());
        resp.setOrderType(order.getOrderType());
        resp.setTableName(order.getTable() != null ? order.getTable().getTableNumber() : null);
        resp.setCustomerName(order.getCustomerName());
        resp.setCustomerPhone(order.getCustomerPhone());
        resp.setSubtotal(order.getSubtotal());
        resp.setDiscountAmount(order.getDiscountAmount());
        resp.setTaxAmount(order.getTaxAmount());
        resp.setServiceChargeAmount(order.getServiceChargeAmount());
        resp.setTotalAmount(order.getTotalAmount());
        resp.setStatus(order.getStatus());
        resp.setNotes(order.getNotes());
        resp.setCreatedAt(order.getCreatedAt());

        List<OrderResponse.OrderItemResponse> itemResponses = order.getItems().stream()
                .map(item -> new OrderResponse.OrderItemResponse(
                        item.getId(),
                        item.getProduct() != null ? item.getProduct().getId() : null,
                        item.getProductNameSnapshot(),
                        item.getVariantNameSnapshot(),
                        item.getUnitPriceSnapshot(),
                        item.getQuantity(),
                        item.getSubtotal(),
                        item.getNotes()
                )).collect(Collectors.toList());
        resp.setItems(itemResponses);

        return resp;
    }
}
