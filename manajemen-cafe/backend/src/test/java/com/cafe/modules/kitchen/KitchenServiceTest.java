package com.cafe.modules.kitchen;

import com.cafe.common.TenantContext;
import com.cafe.modules.auth.Outlet;
import com.cafe.modules.auth.Tenant;
import com.cafe.modules.master.DiningTable;
import com.cafe.modules.master.DiningTableRepository;
import com.cafe.modules.pos.Order;
import com.cafe.modules.pos.OrderRepository;
import com.cafe.modules.pos.dto.OrderResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class KitchenServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private DiningTableRepository diningTableRepository;

    @InjectMocks
    private KitchenService kitchenService;

    private Tenant tenant;
    private Outlet outlet;

    @BeforeEach
    void setUp() {
        tenant = new Tenant("Kopi Senja", "kopisenja");
        tenant.setId(1L);

        outlet = new Outlet(tenant, "Cabang Pusat");
        outlet.setId(10L);

        TenantContext.setTenantId(1L);
        TenantContext.setOutletId(10L);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void shouldReturnOnlyActiveKitchenOrders() {
        Order order1 = new Order();
        order1.setId(1L);
        order1.setStatus("PAID");

        Order order2 = new Order();
        order2.setId(2L);
        order2.setStatus("IN_PREPARATION");

        Order order3 = new Order();
        order3.setId(3L);
        order3.setStatus("COMPLETED"); // should be excluded from active queue

        when(orderRepository.findByTenantIdAndOutletIdOrderByCreatedAtDesc(1L, 10L))
                .thenReturn(List.of(order1, order2, order3));

        List<OrderResponse> activeOrders = kitchenService.getActiveKitchenOrders(10L);

        assertEquals(2, activeOrders.size());
        assertEquals(1L, activeOrders.get(0).getId());
        assertEquals(2L, activeOrders.get(1).getId());
    }

    @Test
    void shouldUpdateStatusAndFreeTableOnCompleted() {
        DiningTable table = new DiningTable(outlet, "Meja 01", 4);
        table.setStatus("OCCUPIED");

        Order order = new Order();
        order.setId(100L);
        order.setStatus("READY");
        order.setTable(table);

        when(orderRepository.findByIdAndTenantId(100L, 1L)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        OrderResponse response = kitchenService.updateOrderStatus(100L, "COMPLETED");

        assertEquals("COMPLETED", response.getStatus());
        assertEquals("AVAILABLE", table.getStatus());
        verify(diningTableRepository).save(table);
    }

    @Test
    void shouldRejectInvalidStatus() {
        Order order = new Order();
        order.setId(100L);

        when(orderRepository.findByIdAndTenantId(100L, 1L)).thenReturn(Optional.of(order));

        assertThrows(IllegalArgumentException.class, () ->
                kitchenService.updateOrderStatus(100L, "UNKNOWN_STATUS")
        );
    }
}
