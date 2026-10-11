-- V2__inventory_and_recipes.sql: Migration for Inventory, Recipes (BOM), and Stock Movements

-- 1. Ingredients (Bahan Baku)
CREATE TABLE ingredients (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    unit VARCHAR(30) NOT NULL, -- GRAM, ML, PCS, TSP, PORTION
    cost_per_unit NUMERIC(15,2) DEFAULT 0.00,
    minimum_stock NUMERIC(15,2) DEFAULT 0.00,
    current_stock NUMERIC(15,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_ingredients_tenant_id ON ingredients(tenant_id);

-- 2. Recipes (Bill of Materials per Product)
CREATE TABLE recipes (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL UNIQUE REFERENCES products(id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_recipes_tenant_id ON recipes(tenant_id);
CREATE INDEX idx_recipes_product_id ON recipes(product_id);

-- 3. Recipe Items
CREATE TABLE recipe_items (
    id BIGSERIAL PRIMARY KEY,
    recipe_id BIGINT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    ingredient_id BIGINT NOT NULL REFERENCES ingredients(id) ON DELETE RESTRICT,
    quantity NUMERIC(15,2) NOT NULL DEFAULT 1.00
);
CREATE INDEX idx_recipe_items_recipe_id ON recipe_items(recipe_id);
CREATE INDEX idx_recipe_items_ingredient_id ON recipe_items(ingredient_id);

-- 4. Stock Movements (Audit Trail Log)
CREATE TABLE stock_movements (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    outlet_id BIGINT REFERENCES outlets(id) ON DELETE SET NULL,
    ingredient_id BIGINT NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
    movement_type VARCHAR(50) NOT NULL, -- INITIAL, SALE, PURCHASE, ADJUSTMENT, SPOILED
    quantity_change NUMERIC(15,2) NOT NULL, -- (+/-)
    stock_before NUMERIC(15,2) NOT NULL,
    stock_after NUMERIC(15,2) NOT NULL,
    reference_id VARCHAR(100), -- e.g. order_number or purchase_invoice
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_stock_movements_tenant_id ON stock_movements(tenant_id);
CREATE INDEX idx_stock_movements_ingredient_id ON stock_movements(ingredient_id);
CREATE INDEX idx_stock_movements_created_at ON stock_movements(created_at);
