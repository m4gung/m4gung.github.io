package com.cafe.modules.pos;

import com.cafe.common.TenantContext;
import com.cafe.modules.auth.Outlet;
import com.cafe.modules.auth.OutletRepository;
import com.cafe.modules.auth.Tenant;
import com.cafe.modules.auth.TenantRepository;
import com.cafe.modules.master.DiningTable;
import com.cafe.modules.master.DiningTableRepository;
import com.cafe.modules.master.Product;
import com.cafe.modules.master.ProductRepository;
import com.cafe.modules.master.ProductVariant;
import com.cafe.modules.master.ProductVariantRepository;
import com.cafe.modules.pos.dto.CreateOrderRequest;
import com.cafe.modules.pos.dto.OrderResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

@Service
public class PosService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final ProductVariantRepository variantRepository;
    private final DiningTableRepository diningTableRepository;
    private final OutletRepository outletRepository;
    private final TenantRepository tenantRepository;
    private final PaymentRepository paymentRepository;
    private final com.cafe.modules.inventory.InventoryService inventoryService;

    private static final AtomicLong SEQUENCE = new AtomicLong(1);

    public PosService(
            OrderRepository orderRepository,
            ProductRepository productRepository,
            ProductVariantRepository variantRepository,
            DiningTableRepository diningTableRepository,
            OutletRepository outletRepository,
            TenantRepository tenantRepository,
            PaymentRepository paymentRepository,
            com.cafe.modules.inventory.InventoryService inventoryService) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.variantRepository = variantRepository;
        this.diningTableRepository = diningTableRepository;
        this.outletRepository = outletRepository;
        this.tenantRepository = tenantRepository;
        this.paymentRepository = paymentRepository;
        this.inventoryService = inventoryService;
    }

    @Transactional
    public OrderResponse createAndProcessOrder(CreateOrderRequest request) {
        Long tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            throw new IllegalArgumentException("Tenant ID tidak valid");
        }
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Tenant tidak ditemukan"));

        Long outletId = request.getOutletId() != null ? request.getOutletId() : TenantContext.getOutletId();
        if (outletId == null) {
            throw new IllegalArgumentException("Outlet ID wajib ditentukan");
        }
        Outlet outlet = outletRepository.findById(outletId)
                .orElseThrow(() -> new IllegalArgumentException("Outlet tidak ditemukan"));

        Order order = new Order();
        order.setTenant(tenant);
        order.setOutlet(outlet);
        order.setOrderNumber(generateOrderNumber(tenantId, outletId));
        order.setOrderType(request.getOrderType() != null ? request.getOrderType() : "DINE_IN");
        order.setCustomerName(request.getCustomerName());
        order.setCustomerPhone(request.getCustomerPhone());
        order.setNotes(request.getNotes());

        // Handle Dine-In Table
        if ("DINE_IN".equalsIgnoreCase(order.getOrderType()) && request.getTableId() != null) {
            DiningTable table = diningTableRepository.findByIdAndOutletId(request.getTableId(), outletId)
                    .orElse(null);
            if (table != null) {
                table.setStatus("OCCUPIED");
                diningTableRepository.save(table);
                order.setTable(table);
            }
        }

        // Calculate Items & Price Snapshots
        BigDecimal subtotal = BigDecimal.ZERO;
        List<OrderItem> items = new ArrayList<>();

        for (CreateOrderRequest.ItemRequest itemReq : request.getItems()) {
            Product product = productRepository.findByIdAndTenantId(itemReq.getProductId(), tenantId)
                    .orElseThrow(() -> new IllegalArgumentException("Produk dengan ID " + itemReq.getProductId() + " tidak ditemukan"));

            BigDecimal unitPrice = product.getBasePrice();
            String variantName = null;

            if (itemReq.getVariantId() != null) {
                ProductVariant variant = variantRepository.findByIdAndProductId(itemReq.getVariantId(), product.getId())
                        .orElse(null);
                if (variant != null) {
                    variantName = variant.getName();
                    if (variant.getPriceAdjustment() != null) {
                        unitPrice = unitPrice.add(variant.getPriceAdjustment());
                    }
                }
            }

            int qty = itemReq.getQuantity() != null && itemReq.getQuantity() > 0 ? itemReq.getQuantity() : 1;
            BigDecimal itemSubtotal = unitPrice.multiply(BigDecimal.valueOf(qty));
            subtotal = subtotal.add(itemSubtotal);

            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(order);
            orderItem.setProduct(product);
            orderItem.setProductNameSnapshot(product.getName());
            orderItem.setVariantNameSnapshot(variantName);
            orderItem.setUnitPriceSnapshot(unitPrice);
            orderItem.setQuantity(qty);
            orderItem.setSubtotal(itemSubtotal);
            orderItem.setNotes(itemReq.getNotes());
            items.add(orderItem);
        }

        order.setSubtotal(subtotal);

        // Diskon
        BigDecimal discount = request.getDiscountAmount() != null ? request.getDiscountAmount() : BigDecimal.ZERO;
        if (discount.compareTo(subtotal) > 0) {
            discount = subtotal;
        }
        order.setDiscountAmount(discount);
        BigDecimal taxableBase = subtotal.subtract(discount);

        // Pajak
        BigDecimal taxRate = outlet.getTaxPercentage() != null ? outlet.getTaxPercentage() : BigDecimal.ZERO;
        BigDecimal taxAmount = taxableBase.multiply(taxRate).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        order.setTaxAmount(taxAmount);

        // Service Charge
        BigDecimal serviceRate = outlet.getServiceChargePercentage() != null ? outlet.getServiceChargePercentage() : BigDecimal.ZERO;
        BigDecimal serviceAmount = taxableBase.multiply(serviceRate).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        order.setServiceChargeAmount(serviceAmount);

        // Total
        BigDecimal totalAmount = taxableBase.add(taxAmount).add(serviceAmount);
        order.setTotalAmount(totalAmount);
        order.setItems(items);

        // Process Payment if provided
        Payment payment = null;
        if (request.getPayment() != null) {
            payment = new Payment();
            payment.setTenant(tenant);
            payment.setOrder(order);
            payment.setPaymentMethod(request.getPayment().getPaymentMethod());
            payment.setReferenceNumber(request.getPayment().getReferenceNumber());

            BigDecimal paid = request.getPayment().getAmountPaid() != null ? request.getPayment().getAmountPaid() : totalAmount;
            if (paid.compareTo(totalAmount) < 0 && "CASH".equalsIgnoreCase(payment.getPaymentMethod())) {
                throw new IllegalArgumentException("Nominal uang tunai yang dibayarkan kurang dari total tagihan");
            }

            payment.setAmountPaid(paid);
            payment.setChangeAmount(paid.subtract(totalAmount).max(BigDecimal.ZERO));
            payment.setStatus("SUCCESS");
            order.setStatus("PAID");
            order.getPayments().add(payment);
        } else {
            order.setStatus("PENDING_PAYMENT");
        }

        order = orderRepository.save(order);

        // Deduct inventory ingredients based on recipes if PAID
        if ("PAID".equalsIgnoreCase(order.getStatus())) {
            inventoryService.deductStockForOrder(order);
        }

        return mapToResponse(order, payment);
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrderById(Long id) {
        Long tenantId = TenantContext.getTenantId();
        Order order = orderRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Pesanan tidak ditemukan"));
        Payment payment = order.getPayments().isEmpty() ? null : order.getPayments().get(0);
        return mapToResponse(order, payment);
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getOrders(Long outletId) {
        Long tenantId = TenantContext.getTenantId();
        Long effectiveOutlet = outletId != null ? outletId : TenantContext.getOutletId();
        return orderRepository.findByTenantIdAndOutletIdOrderByCreatedAtDesc(tenantId, effectiveOutlet).stream()
                .map(o -> mapToResponse(o, o.getPayments().isEmpty() ? null : o.getPayments().get(0)))
                .collect(Collectors.toList());
    }

    @Transactional
    public OrderResponse voidOrder(Long id, String reason) {
        Long tenantId = TenantContext.getTenantId();
        Order order = orderRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Pesanan tidak ditemukan"));
        
        order.setStatus("CANCELLED");
        if (reason != null && !reason.isBlank()) {
            order.setNotes((order.getNotes() != null ? order.getNotes() + " | " : "") + "VOID: " + reason);
        }
        Order saved = orderRepository.save(order);
        Payment payment = saved.getPayments().isEmpty() ? null : saved.getPayments().get(0);
        return mapToResponse(saved, payment);
    }

    private String generateOrderNumber(Long tenantId, Long outletId) {
        String datePrefix = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        long seq = SEQUENCE.getAndIncrement() % 10000;
        return String.format("CF-%s-%04d", datePrefix, seq);
    }

    private OrderResponse mapToResponse(Order order, Payment payment) {
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

        if (payment != null) {
            resp.setPayment(new OrderResponse.PaymentInfo(
                    payment.getPaymentMethod(),
                    payment.getAmountPaid(),
                    payment.getChangeAmount(),
                    payment.getStatus(),
                    payment.getPaidAt()
            ));
        }

        return resp;
    }
}
