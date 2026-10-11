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
import com.cafe.modules.master.ProductVariantRepository;
import com.cafe.modules.pos.dto.CreateOrderRequest;
import com.cafe.modules.pos.dto.OrderResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PosServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ProductVariantRepository variantRepository;

    @Mock
    private DiningTableRepository diningTableRepository;

    @Mock
    private OutletRepository outletRepository;

    @Mock
    private TenantRepository tenantRepository;

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private com.cafe.modules.inventory.InventoryService inventoryService;

    @InjectMocks
    private PosService posService;

    private Tenant tenant;
    private Outlet outlet;
    private Product product;

    @BeforeEach
    void setUp() {
        tenant = new Tenant("Kopi Senja", "kopisenja");
        tenant.setId(1L);

        outlet = new Outlet(tenant, "Cabang Pusat");
        outlet.setId(10L);
        outlet.setTaxPercentage(new BigDecimal("10.00")); // 10% tax
        outlet.setServiceChargePercentage(BigDecimal.ZERO);

        product = new Product();
        product.setId(100L);
        product.setTenant(tenant);
        product.setName("Kopi Susu Aren");
        product.setBasePrice(new BigDecimal("20000.00"));

        TenantContext.setTenantId(1L);
        TenantContext.setOutletId(10L);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void shouldCreateOrderAndCalculateAccuratelyWithSnapshot() {
        when(tenantRepository.findById(1L)).thenReturn(Optional.of(tenant));
        when(outletRepository.findById(10L)).thenReturn(Optional.of(outlet));
        when(productRepository.findByIdAndTenantId(100L, 1L)).thenReturn(Optional.of(product));

        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> {
            Order o = invocation.getArgument(0);
            o.setId(999L);
            return o;
        });

        CreateOrderRequest request = new CreateOrderRequest();
        request.setOrderType("TAKEAWAY");

        CreateOrderRequest.ItemRequest itemReq = new CreateOrderRequest.ItemRequest();
        itemReq.setProductId(100L);
        itemReq.setQuantity(2); // 2 x 20.000 = 40.000
        request.setItems(List.of(itemReq));

        CreateOrderRequest.PaymentRequest payReq = new CreateOrderRequest.PaymentRequest();
        payReq.setPaymentMethod("CASH");
        payReq.setAmountPaid(new BigDecimal("50000.00")); // Bayar 50.000
        request.setPayment(payReq);

        OrderResponse response = posService.createAndProcessOrder(request);

        assertNotNull(response);
        assertEquals(999L, response.getId());
        assertEquals("PAID", response.getStatus());

        // Subtotal = 2 * 20.000 = 40.000
        assertEquals(new BigDecimal("40000.00"), response.getSubtotal());

        // Pajak 10% dari 40.000 = 4.000
        assertEquals(new BigDecimal("4000.00"), response.getTaxAmount());

        // Total = 40.000 + 4.000 = 44.000
        assertEquals(new BigDecimal("44000.00"), response.getTotalAmount());

        // Kembalian = 50.000 - 44.000 = 6.000
        assertNotNull(response.getPayment());
        assertEquals(new BigDecimal("6000.00"), response.getPayment().getChangeAmount());

        // Snapshot verifikasi
        assertEquals(1, response.getItems().size());
        assertEquals("Kopi Susu Aren", response.getItems().get(0).getProductName());
        assertEquals(new BigDecimal("20000.00"), response.getItems().get(0).getUnitPrice());
    }

    @Test
    void shouldOccupyTableForDineIn() {
        when(tenantRepository.findById(1L)).thenReturn(Optional.of(tenant));
        when(outletRepository.findById(10L)).thenReturn(Optional.of(outlet));
        when(productRepository.findByIdAndTenantId(100L, 1L)).thenReturn(Optional.of(product));

        DiningTable table = new DiningTable(outlet, "Meja 01", 4);
        table.setId(55L);
        table.setStatus("AVAILABLE");
        when(diningTableRepository.findByIdAndOutletId(55L, 10L)).thenReturn(Optional.of(table));

        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CreateOrderRequest request = new CreateOrderRequest();
        request.setOrderType("DINE_IN");
        request.setTableId(55L);

        CreateOrderRequest.ItemRequest itemReq = new CreateOrderRequest.ItemRequest();
        itemReq.setProductId(100L);
        itemReq.setQuantity(1);
        request.setItems(List.of(itemReq));

        posService.createAndProcessOrder(request);

        // Verifikasi status meja berubah menjadi OCCUPIED
        assertEquals("OCCUPIED", table.getStatus());
        verify(diningTableRepository).save(table);
    }
}
