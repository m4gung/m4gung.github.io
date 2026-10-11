import React, { useState, useEffect } from 'react';
import {
  Package,
  Layers,
  History,
  AlertTriangle,
  Plus,
  Edit2,
  Trash2,
  Search,
  CheckCircle2,
  Calculator,
  TrendingUp,
  DollarSign,
  Scale,
  X
} from 'lucide-react';
import {
  db,
  type LocalIngredient,
  type LocalRecipe,
  type LocalStockMovement,
  type LocalProduct
} from '../db/cafeDb';
import { formatCurrency } from '../utils/receiptFormatter';

type InventoryTab = 'INGREDIENTS' | 'RECIPES' | 'MOVEMENTS';

export const InventoryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<InventoryTab>('INGREDIENTS');

  // Data states
  const [ingredients, setIngredients] = useState<LocalIngredient[]>([]);
  const [recipes, setRecipes] = useState<LocalRecipe[]>([]);
  const [products, setProducts] = useState<LocalProduct[]>([]);
  const [movements, setMovements] = useState<LocalStockMovement[]>([]);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLowStockOnly, setFilterLowStockOnly] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [filterMovementIngredientId, setFilterMovementIngredientId] = useState<number | null>(null);

  // Modals
  const [isIngredientModalOpen, setIsIngredientModalOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<LocalIngredient | null>(null);
  const [ingredientForm, setIngredientForm] = useState({
    name: '',
    unit: 'gram',
    costPerUnit: 0,
    minimumStock: 100,
    currentStock: 1000
  });

  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [adjustingIngredient, setAdjustingIngredient] = useState<LocalIngredient | null>(null);
  const [adjustmentForm, setAdjustmentForm] = useState({
    movementType: 'IN' as 'IN' | 'OUT' | 'ADJUSTMENT' | 'WASTE',
    quantity: 0,
    notes: ''
  });

  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [recipeForm, setRecipeForm] = useState<{
    productId: number;
    notes: string;
    items: Array<{ ingredientId: number; quantity: number }>;
  }>({
    productId: 1,
    notes: '',
    items: []
  });

  // Load all data
  const loadData = async () => {
    const allIngredients = await db.ingredients.toArray();
    const allRecipes = await db.recipes.toArray();
    const allProducts = await db.products.toArray();
    const allMovements = await db.stockMovements.reverse().sortBy('createdAt');

    setIngredients(allIngredients);
    setRecipes(allRecipes);
    setProducts(allProducts);
    setMovements(allMovements);

    if (allProducts.length > 0 && selectedProductId === null) {
      setSelectedProductId(allProducts[0].id);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered ingredients
  const filteredIngredients = ingredients.filter((ing) => {
    const matchesSearch = ing.name.toLowerCase().includes(searchQuery.toLowerCase());
    const isLow = ing.currentStock <= ing.minimumStock;
    if (filterLowStockOnly) return matchesSearch && isLow;
    return matchesSearch;
  });

  // KPI Calculations
  const totalIngredientsCount = ingredients.length;
  const lowStockCount = ingredients.filter((i) => i.currentStock <= i.minimumStock).length;
  const totalStockValuation = ingredients.reduce((sum, i) => sum + i.currentStock * i.costPerUnit, 0);

  // ================= INGREDIENT ACTIONS =================
  const handleOpenAddIngredient = () => {
    setEditingIngredient(null);
    setIngredientForm({
      name: '',
      unit: 'gram',
      costPerUnit: 100,
      minimumStock: 500,
      currentStock: 1000
    });
    setIsIngredientModalOpen(true);
  };

  const handleOpenEditIngredient = (ing: LocalIngredient) => {
    setEditingIngredient(ing);
    setIngredientForm({
      name: ing.name,
      unit: ing.unit,
      costPerUnit: ing.costPerUnit,
      minimumStock: ing.minimumStock,
      currentStock: ing.currentStock
    });
    setIsIngredientModalOpen(true);
  };

  const handleSaveIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingredientForm.name.trim()) return;

    if (editingIngredient) {
      await db.ingredients.update(editingIngredient.id, {
        name: ingredientForm.name.trim(),
        unit: ingredientForm.unit,
        costPerUnit: Number(ingredientForm.costPerUnit),
        minimumStock: Number(ingredientForm.minimumStock),
        currentStock: Number(ingredientForm.currentStock)
      });
    } else {
      const nextId = (await db.ingredients.count()) > 0
        ? (await db.ingredients.orderBy('id').last())!.id + 1
        : 1;

      const newIng: LocalIngredient = {
        id: nextId,
        name: ingredientForm.name.trim(),
        unit: ingredientForm.unit,
        costPerUnit: Number(ingredientForm.costPerUnit),
        minimumStock: Number(ingredientForm.minimumStock),
        currentStock: Number(ingredientForm.currentStock),
        isActive: true
      };
      await db.ingredients.add(newIng);

      // Record initial movement
      await db.stockMovements.add({
        ingredientId: nextId,
        ingredientName: newIng.name,
        movementType: 'IN',
        quantityChange: newIng.currentStock,
        stockBefore: 0,
        stockAfter: newIng.currentStock,
        referenceId: 'MANUAL-ADD',
        notes: 'Penambahan bahan baku baru',
        createdAt: new Date().toISOString()
      });
    }

    setIsIngredientModalOpen(false);
    await loadData();
  };

  const handleDeleteIngredient = async (id: number) => {
    if (confirm('Yakin ingin menghapus bahan baku ini?')) {
      await db.ingredients.delete(id);
      await loadData();
    }
  };

  // ================= STOCK ADJUSTMENT ACTIONS =================
  const handleOpenAdjustment = (ing: LocalIngredient) => {
    setAdjustingIngredient(ing);
    setAdjustmentForm({
      movementType: 'IN',
      quantity: 0,
      notes: ''
    });
    setIsAdjustmentModalOpen(true);
  };

  const handleSaveAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingIngredient || adjustmentForm.quantity <= 0) return;

    const qty = Number(adjustmentForm.quantity);
    const stockBefore = adjustingIngredient.currentStock;
    let qtyChange = qty;
    let stockAfter = stockBefore;

    if (adjustmentForm.movementType === 'IN') {
      qtyChange = qty;
      stockAfter = stockBefore + qty;
    } else if (adjustmentForm.movementType === 'OUT' || adjustmentForm.movementType === 'WASTE') {
      qtyChange = -qty;
      stockAfter = Math.max(0, stockBefore - qty);
    } else if (adjustmentForm.movementType === 'ADJUSTMENT') {
      // Direct Opname
      qtyChange = qty - stockBefore;
      stockAfter = qty;
    }

    await db.ingredients.update(adjustingIngredient.id, { currentStock: stockAfter });

    await db.stockMovements.add({
      ingredientId: adjustingIngredient.id,
      ingredientName: adjustingIngredient.name,
      movementType: adjustmentForm.movementType,
      quantityChange: qtyChange,
      stockBefore,
      stockAfter,
      referenceId: 'OPNAME-' + Date.now().toString().slice(-6),
      notes: adjustmentForm.notes || 'Penyesuaian stok manual',
      createdAt: new Date().toISOString()
    });

    setIsAdjustmentModalOpen(false);
    await loadData();
  };

  // ================= RECIPE ACTIONS =================
  const currentSelectedRecipe = recipes.find((r) => r.productId === selectedProductId);
  const currentSelectedProduct = products.find((p) => p.id === selectedProductId);

  // Compute Recipe COGS (HPP)
  const calculateHpp = (recipe?: LocalRecipe) => {
    if (!recipe) return 0;
    return recipe.items.reduce((sum, item) => {
      const ing = ingredients.find((i) => i.id === item.ingredientId);
      return sum + (ing ? ing.costPerUnit * item.quantity : 0);
    }, 0);
  };

  // Compute Portion Availability
  const calculateMaxPortions = (recipe?: LocalRecipe) => {
    if (!recipe || recipe.items.length === 0) return 0;
    const portions = recipe.items.map((item) => {
      const ing = ingredients.find((i) => i.id === item.ingredientId);
      if (!ing || item.quantity <= 0) return 0;
      return Math.floor(ing.currentStock / item.quantity);
    });
    return Math.min(...portions);
  };

  const handleOpenEditRecipe = () => {
    if (!selectedProductId) return;
    if (currentSelectedRecipe) {
      setRecipeForm({
        productId: currentSelectedRecipe.productId,
        notes: currentSelectedRecipe.notes || '',
        items: [...currentSelectedRecipe.items]
      });
    } else {
      setRecipeForm({
        productId: selectedProductId,
        notes: '',
        items: []
      });
    }
    setIsRecipeModalOpen(true);
  };

  const handleAddRecipeItemRow = () => {
    if (ingredients.length === 0) return;
    setRecipeForm({
      ...recipeForm,
      items: [...recipeForm.items, { ingredientId: ingredients[0].id, quantity: 10 }]
    });
  };

  const handleRemoveRecipeItemRow = (index: number) => {
    const updated = [...recipeForm.items];
    updated.splice(index, 1);
    setRecipeForm({ ...recipeForm, items: updated });
  };

  const handleSaveRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipeForm.productId) return;

    if (currentSelectedRecipe) {
      await db.recipes.update(currentSelectedRecipe.id, {
        notes: recipeForm.notes,
        items: recipeForm.items
      });
    } else {
      const nextId = (await db.recipes.count()) > 0
        ? (await db.recipes.orderBy('id').last())!.id + 1
        : 1;
      await db.recipes.add({
        id: nextId,
        productId: recipeForm.productId,
        notes: recipeForm.notes,
        items: recipeForm.items
      });
    }

    setIsRecipeModalOpen(false);
    await loadData();
  };

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 space-y-6">
      {/* Top Header & Sub-Navigation */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
            <Package className="w-6 h-6 text-amber-600" />
            <span>Inventaris & Resep Produk (BOM)</span>
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Kelola stok bahan baku, resep komposisi menu, perhitungan HPP otomatis, dan riwayat mutasi.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200">
          <button
            onClick={() => setActiveTab('INGREDIENTS')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'INGREDIENTS'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Bahan Baku</span>
            {lowStockCount > 0 && (
              <span className="ml-1 bg-red-500 text-white text-[10px] px-1.5 py-0.2 rounded-full">
                {lowStockCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('RECIPES')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'RECIPES'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Resep Produk (BOM)</span>
          </button>
          <button
            onClick={() => setActiveTab('MOVEMENTS')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'MOVEMENTS'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Mutasi Stok</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex items-center space-x-3.5">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-stone-500 font-medium">Total Jenis Bahan Baku</p>
            <h3 className="text-xl font-bold text-stone-900">{totalIngredientsCount} Item</h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex items-center space-x-3.5">
          <div className={`p-3 rounded-xl ${lowStockCount > 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-stone-500 font-medium">Bahan Stok Menipis / Kritis</p>
            <h3 className={`text-xl font-bold ${lowStockCount > 0 ? 'text-red-600' : 'text-emerald-700'}`}>
              {lowStockCount} Item
            </h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex items-center space-x-3.5">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-stone-500 font-medium">Valuasi Total Aset Stok</p>
            <h3 className="text-xl font-bold text-amber-700">{formatCurrency(totalStockValuation)}</h3>
          </div>
        </div>
      </div>

      {/* TAB 1: INGREDIENTS LIST */}
      {activeTab === 'INGREDIENTS' && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden space-y-4 p-4 sm:p-5">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Cari nama bahan baku (cth: Susu, Kopi)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <button
                onClick={() => setFilterLowStockOnly(!filterLowStockOnly)}
                className={`px-3 py-2 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition whitespace-nowrap ${
                  filterLowStockOnly
                    ? 'bg-red-50 border-red-300 text-red-700 font-semibold'
                    : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Hanya Stok Kritis</span>
              </button>
            </div>

            <button
              onClick={handleOpenAddIngredient}
              className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Bahan Baku</span>
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-stone-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200">
                <tr>
                  <th className="py-3 px-4">Nama Bahan</th>
                  <th className="py-3 px-3">Satuan</th>
                  <th className="py-3 px-3 text-right">Stok Saat Ini</th>
                  <th className="py-3 px-3 text-right">Batas Min.</th>
                  <th className="py-3 px-3 text-right">Harga Modal/Satuan</th>
                  <th className="py-3 px-3 text-right">Total Nilai</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-800">
                {filteredIngredients.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-stone-400">
                      Tidak ada data bahan baku ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredIngredients.map((ing) => {
                    const isLow = ing.currentStock <= ing.minimumStock;
                    const totalVal = ing.currentStock * ing.costPerUnit;

                    return (
                      <tr key={ing.id} className="hover:bg-stone-50/70 transition">
                        <td className="py-3 px-4 font-semibold text-stone-900">
                          {ing.name}
                        </td>
                        <td className="py-3 px-3 text-stone-500 font-mono">
                          {ing.unit}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-stone-900">
                          {ing.currentStock.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-stone-500">
                          {ing.minimumStock.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-stone-600">
                          {formatCurrency(ing.costPerUnit)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-medium text-amber-700">
                          {formatCurrency(totalVal)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {isLow ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-700">
                              <AlertTriangle className="w-3 h-3" />
                              Kritis
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700">
                              <CheckCircle2 className="w-3 h-3" />
                              Aman
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenAdjustment(ing)}
                              title="Penyesuaian Stok / Opname"
                              className="p-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition border border-amber-200"
                            >
                              <Scale className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Opname</span>
                            </button>
                            <button
                              onClick={() => handleOpenEditIngredient(ing)}
                              title="Edit Bahan"
                              className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteIngredient(ing.id)}
                              title="Hapus Bahan"
                              className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: RECIPES (BILL OF MATERIALS) */}
      {activeTab === 'RECIPES' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Product Selector */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-amber-600" />
              <span>Pilih Menu Produk</span>
            </h3>
            <p className="text-[11px] text-stone-500">
              Pilih menu kafe untuk mengonfigurasi takaran bahan baku (BOM) & HPP otomatis.
            </p>

            <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
              {products.map((p) => {
                const hasRecipe = recipes.some((r) => r.productId === p.id);
                const isSelected = selectedProductId === p.id;

                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedProductId(p.id)}
                    className={`w-full text-left p-3 rounded-xl border text-xs transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-amber-50 border-amber-400 shadow-sm'
                        : 'border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    <div>
                      <p className={`font-semibold ${isSelected ? 'text-amber-900' : 'text-stone-900'}`}>
                        {p.name}
                      </p>
                      <p className="text-[10px] text-stone-500 font-mono mt-0.5">
                        {formatCurrency(p.basePrice)}
                      </p>
                    </div>

                    {hasRecipe ? (
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">
                        Ada Resep
                      </span>
                    ) : (
                      <span className="text-[10px] bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full">
                        Belum Ada
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Recipe Breakdown & COGS Calculator */}
          <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-5">
            {currentSelectedProduct ? (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-200">
                  <div>
                    <h3 className="text-lg font-bold text-stone-900">
                      {currentSelectedProduct.name}
                    </h3>
                    <p className="text-xs text-stone-500">
                      Harga Jual: <span className="font-bold text-stone-900">{formatCurrency(currentSelectedProduct.basePrice)}</span>
                    </p>
                  </div>

                  <button
                    onClick={handleOpenEditRecipe}
                    className="bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition self-start sm:self-auto"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>{currentSelectedRecipe ? 'Ubah Komposisi Resep' : 'Buat Resep Baru'}</span>
                  </button>
                </div>

                {/* Recipe Cost Calculation Cards */}
                {(() => {
                  const hpp = calculateHpp(currentSelectedRecipe);
                  const marginRp = currentSelectedProduct.basePrice - hpp;
                  const marginPct = currentSelectedProduct.basePrice > 0
                    ? ((marginRp / currentSelectedProduct.basePrice) * 100).toFixed(1)
                    : '0';
                  const portions = calculateMaxPortions(currentSelectedRecipe);

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200">
                        <span className="text-[11px] text-stone-500 flex items-center gap-1">
                          <Calculator className="w-3.5 h-3.5 text-stone-500" />
                          HPP / Modal Bahan
                        </span>
                        <p className="text-base font-bold text-stone-900 mt-1">
                          {formatCurrency(hpp)}
                        </p>
                      </div>

                      <div className="bg-emerald-50 p-3.5 rounded-xl border border-emerald-200">
                        <span className="text-[11px] text-emerald-700 flex items-center gap-1">
                          <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                          Laba Kotor (Margin)
                        </span>
                        <p className="text-base font-bold text-emerald-800 mt-1">
                          {formatCurrency(marginRp)} ({marginPct}%)
                        </p>
                      </div>

                      <div className="bg-blue-50 p-3.5 rounded-xl border border-blue-200">
                        <span className="text-[11px] text-blue-700 flex items-center gap-1">
                          <Package className="w-3.5 h-3.5 text-blue-600" />
                          Kapasitas Stok Saat Ini
                        </span>
                        <p className="text-base font-bold text-blue-900 mt-1">
                          ~{portions} Porsi Tersisa
                        </p>
                      </div>
                    </div>
                  );
                })()}

                {/* Ingredients Breakdown Table */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                    Daftar Komposisi Bahan Per Porsi
                  </h4>

                  {currentSelectedRecipe && currentSelectedRecipe.items.length > 0 ? (
                    <div className="rounded-xl border border-stone-200 overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200">
                          <tr>
                            <th className="py-2.5 px-3">Bahan Baku</th>
                            <th className="py-2.5 px-3 text-right">Takaran Resep</th>
                            <th className="py-2.5 px-3 text-right">Biaya Satuan</th>
                            <th className="py-2.5 px-3 text-right">Subtotal Modal</th>
                            <th className="py-2.5 px-3 text-right">Sisa Stok Gudang</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                          {currentSelectedRecipe.items.map((item, idx) => {
                            const ing = ingredients.find((i) => i.id === item.ingredientId);
                            const itemCost = ing ? ing.costPerUnit * item.quantity : 0;

                            return (
                              <tr key={idx} className="hover:bg-stone-50/60">
                                <td className="py-2.5 px-3 font-medium text-stone-900">
                                  {ing ? ing.name : 'Unknown Ingredient'}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono font-bold text-stone-800">
                                  {item.quantity} {ing?.unit}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono text-stone-500">
                                  {formatCurrency(ing?.costPerUnit || 0)}/{ing?.unit}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono font-semibold text-amber-800">
                                  {formatCurrency(itemCost)}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono text-stone-600">
                                  {ing ? `${ing.currentStock} ${ing.unit}` : '-'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="bg-stone-50 p-6 rounded-xl text-center text-xs text-stone-500 border border-dashed border-stone-300">
                      Belum ada komposisi resep untuk produk ini. Klik tombol di atas untuk membuat resep BOM.
                    </div>
                  )}

                  {currentSelectedRecipe?.notes && (
                    <p className="text-[11px] text-stone-500 italic mt-2">
                      Catatan Resep: "{currentSelectedRecipe.notes}"
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div className="py-12 text-center text-stone-400 text-xs">
                Silakan pilih salah satu produk dari daftar di sebelah kiri.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: STOCK MOVEMENTS LOG */}
      {activeTab === 'MOVEMENTS' && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                <History className="w-4 h-4 text-amber-600" />
                <span>Riwayat Audit Mutasi Stok</span>
              </h3>
              <p className="text-[11px] text-stone-500">
                Log mutasi dari transaksi kasir POS, barang masuk gudang, stock opname, dan waste.
              </p>
            </div>

            {/* Filter by ingredient */}
            <div className="flex items-center space-x-2">
              <span className="text-xs text-stone-500 font-medium">Bahan:</span>
              <select
                value={filterMovementIngredientId || ''}
                onChange={(e) => setFilterMovementIngredientId(e.target.value ? Number(e.target.value) : null)}
                className="text-xs bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="">Semua Bahan Baku</option>
                {ingredients.map((ing) => (
                  <option key={ing.id} value={ing.id}>
                    {ing.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Movements Table */}
          <div className="overflow-x-auto rounded-xl border border-stone-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200">
                <tr>
                  <th className="py-3 px-3">Waktu</th>
                  <th className="py-3 px-3">Bahan Baku</th>
                  <th className="py-3 px-3 text-center">Tipe Mutasi</th>
                  <th className="py-3 px-3 text-right">Perubahan Qty</th>
                  <th className="py-3 px-3 text-right">Stok Sebelum</th>
                  <th className="py-3 px-3 text-right">Sisa Stok Akhir</th>
                  <th className="py-3 px-3">Referensi / Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-800">
                {movements
                  .filter((m) => filterMovementIngredientId ? m.ingredientId === filterMovementIngredientId : true)
                  .map((m, idx) => {
                    const isPositive = m.quantityChange > 0;

                    return (
                      <tr key={idx} className="hover:bg-stone-50/70 transition">
                        <td className="py-2.5 px-3 text-stone-500 text-[11px] whitespace-nowrap">
                          {new Date(m.createdAt).toLocaleString('id-ID')}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-stone-900">
                          {m.ingredientName}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {m.movementType === 'SALE' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-700">
                              POS Sale
                            </span>
                          )}
                          {m.movementType === 'IN' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700">
                              Stok Masuk
                            </span>
                          )}
                          {m.movementType === 'ADJUSTMENT' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700">
                              Opname
                            </span>
                          )}
                          {m.movementType === 'WASTE' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                              Waste / Rusak
                            </span>
                          )}
                        </td>
                        <td className={`py-2.5 px-3 text-right font-mono font-bold ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                          {isPositive ? `+${m.quantityChange}` : m.quantityChange}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-stone-500">
                          {m.stockBefore}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-stone-900">
                          {m.stockAfter}
                        </td>
                        <td className="py-2.5 px-3 text-stone-600 text-[11px]">
                          {m.notes || m.referenceId || '-'}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD / EDIT INGREDIENT */}
      {isIngredientModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-stone-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between">
              <h3 className="font-bold text-stone-900 text-sm">
                {editingIngredient ? 'Edit Bahan Baku' : 'Tambah Bahan Baku Baru'}
              </h3>
              <button
                onClick={() => setIsIngredientModalOpen(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveIngredient} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Nama Bahan Baku</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Biji Kopi Arabika, Fresh Milk..."
                  value={ingredientForm.name}
                  onChange={(e) => setIngredientForm({ ...ingredientForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Satuan Takar (Unit)</label>
                  <select
                    value={ingredientForm.unit}
                    onChange={(e) => setIngredientForm({ ...ingredientForm, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="gram">gram (gr)</option>
                    <option value="ml">mililiter (ml)</option>
                    <option value="pcs">pcs / butir</option>
                    <option value="kg">kilogram (kg)</option>
                    <option value="liter">liter (lt)</option>
                    <option value="portion">porsi</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Harga Modal Per Satuan (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={ingredientForm.costPerUnit}
                    onChange={(e) => setIngredientForm({ ...ingredientForm, costPerUnit: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Stok Saat Ini</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={ingredientForm.currentStock}
                    onChange={(e) => setIngredientForm({ ...ingredientForm, currentStock: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Batas Minimum Peringatan</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={ingredientForm.minimumStock}
                    onChange={(e) => setIngredientForm({ ...ingredientForm, minimumStock: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsIngredientModalOpen(false)}
                  className="px-4 py-2 border border-stone-200 rounded-xl text-stone-600 hover:bg-stone-50 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold shadow-sm transition"
                >
                  Simpan Bahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: STOCK OPNAME / ADJUSTMENT */}
      {isAdjustmentModalOpen && adjustingIngredient && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-stone-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-stone-900 text-sm">
                  Penyesuaian Stok / Opname
                </h3>
                <p className="text-[11px] text-stone-500">
                  {adjustingIngredient.name} (Stok Saat Ini: {adjustingIngredient.currentStock} {adjustingIngredient.unit})
                </p>
              </div>
              <button
                onClick={() => setIsAdjustmentModalOpen(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdjustment} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Jenis Mutasi</label>
                <select
                  value={adjustmentForm.movementType}
                  onChange={(e) => setAdjustmentForm({ ...adjustmentForm, movementType: e.target.value as any })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="IN">Stok Masuk (Pembelian Manual / Tambah Stok)</option>
                  <option value="OUT">Stok Keluar Manual</option>
                  <option value="ADJUSTMENT">Stock Opname Fisik (Set Nilai Riil Baru)</option>
                  <option value="WASTE">Waste / Basi / Rusak / Tumpah</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  {adjustmentForm.movementType === 'ADJUSTMENT'
                    ? `Hasil Hitung Fisik Sebenarnya (${adjustingIngredient.unit})`
                    : `Jumlah Kuantitas (${adjustingIngredient.unit})`}
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="any"
                  required
                  placeholder="Masukkan jumlah..."
                  value={adjustmentForm.quantity || ''}
                  onChange={(e) => setAdjustmentForm({ ...adjustmentForm, quantity: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Catatan / Alasan</label>
                <input
                  type="text"
                  placeholder="Contoh: Hasil audit opname mingguan, susu kadaluarsa..."
                  value={adjustmentForm.notes}
                  onChange={(e) => setAdjustmentForm({ ...adjustmentForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAdjustmentModalOpen(false)}
                  className="px-4 py-2 border border-stone-200 rounded-xl text-stone-600 hover:bg-stone-50 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold shadow-sm transition"
                >
                  Simpan Penyesuaian
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CONFIGURE RECIPE BOM */}
      {isRecipeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-stone-900 text-sm">
                  Konfigurasi Resep BOM Menu
                </h3>
                <p className="text-[11px] text-stone-500">
                  {products.find((p) => p.id === recipeForm.productId)?.name}
                </p>
              </div>
              <button
                onClick={() => setIsRecipeModalOpen(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRecipe} className="p-5 flex-1 overflow-y-auto space-y-4 text-xs">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-stone-700">Komposisi Bahan Per Porsi</label>
                  <button
                    type="button"
                    onClick={handleAddRecipeItemRow}
                    className="text-amber-600 hover:text-amber-800 font-semibold flex items-center gap-1 text-[11px]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Baris Bahan</span>
                  </button>
                </div>

                {recipeForm.items.map((row, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                    <select
                      value={row.ingredientId}
                      onChange={(e) => {
                        const updated = [...recipeForm.items];
                        updated[idx].ingredientId = Number(e.target.value);
                        setRecipeForm({ ...recipeForm, items: updated });
                      }}
                      className="flex-1 px-2.5 py-1.5 border border-stone-200 rounded-lg bg-white text-xs"
                    >
                      {ingredients.map((ing) => (
                        <option key={ing.id} value={ing.id}>
                          {ing.name} ({ing.unit})
                        </option>
                      ))}
                    </select>

                    <div className="w-24 flex items-center">
                      <input
                        type="number"
                        min="0.1"
                        step="any"
                        required
                        value={row.quantity}
                        onChange={(e) => {
                          const updated = [...recipeForm.items];
                          updated[idx].quantity = Number(e.target.value);
                          setRecipeForm({ ...recipeForm, items: updated });
                        }}
                        className="w-full px-2 py-1.5 border border-stone-200 rounded-lg text-xs font-mono text-right"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveRecipeItemRow(idx)}
                      className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Catatan Resep / SOP Barista</label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Masukkan espresso shot terlebih dahulu, lalu steam susu ke suhu 65°C..."
                  value={recipeForm.notes}
                  onChange={(e) => setRecipeForm({ ...recipeForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsRecipeModalOpen(false)}
                  className="px-4 py-2 border border-stone-200 rounded-xl text-stone-600 hover:bg-stone-50 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold shadow-sm transition"
                >
                  Simpan Resep
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
