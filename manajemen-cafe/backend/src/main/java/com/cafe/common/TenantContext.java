package com.cafe.common;

public class TenantContext {
    private static final ThreadLocal<Long> CURRENT_TENANT = new ThreadLocal<>();
    private static final ThreadLocal<Long> CURRENT_OUTLET = new ThreadLocal<>();

    public static void setTenantId(Long tenantId) {
        CURRENT_TENANT.set(tenantId);
    }

    public static Long getTenantId() {
        return CURRENT_TENANT.get();
    }

    public static void setOutletId(Long outletId) {
        CURRENT_OUTLET.set(outletId);
    }

    public static Long getOutletId() {
        return CURRENT_OUTLET.get();
    }

    public static void clear() {
        CURRENT_TENANT.remove();
        CURRENT_OUTLET.remove();
    }
}
