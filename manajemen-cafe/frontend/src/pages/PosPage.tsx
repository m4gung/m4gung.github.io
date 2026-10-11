import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  UtensilsCrossed,
  ShoppingBag,
  CreditCard,
  DollarSign,
  QrCode,
  CheckCircle2,
  Tag,
  SlidersHorizontal,
  X
} from 'lucide-react';
import {
  db,
  deductStockForLocalOrder,
  type LocalCategory,
  type LocalProduct,
  type LocalTable,
  type LocalOrder,
  type LocalModifier
} from '../db/cafeDb';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/receiptFormatter';
import { syncManager } from '../api/syncManager';
import { ReceiptModal } from '../components/ReceiptModal';

interface CartItem {
  id: string; // unique item instance id
  product: LocalProduct;
  quantity: number;
  variantName?: string;
  modifiers?: Array<{ name: string; price: number }>;
  notes?: string;
}

function createNewOrderNumber(): string {
  return `CF-${Date.now().toString().slice(-6)}`;
}

function createNewSyncId(): string {
  return `ord_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
}

export const PosPage: React.FC = () => {
  const { activeOutlet } = useApp();
  const [categories, setCategories] = useState<LocalCategory[]>([]);
  const [products, setProducts] = useState<LocalProduct[]>([]);
  const [tables, setTables] = useState<LocalTable[]>([]);
  const [availableModifiers, setAvailableModifiers] = useState<LocalModifier[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<'DINE_IN' | 'TAKEAWAY'>('DINE_IN');
  const [selectedTable, setSelectedTable] = useState<string>('Meja 01');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [showDiscountInput, setShowDiscountInput] = useState(false);
  
  // Item Customization Modal
  const [customizingProduct, setCustomizingProduct] = useState<LocalProduct | null>(null);
  const [selectedItemModifiers, setSelectedItemModifiers] = useState<Array<{ name: string; price: number }>>([]);
  const [itemNote, setItemNote] = useState('');

  // Checkout Modal State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'QRIS' | 'BANK_TRANSFER'>('CASH');
  const [cashAmount, setCashAmount] = useState<number>(0);
  const [completedOrder, setCompletedOrder] = useState<LocalOrder | null>(null);

  useEffect(() => {
    async function loadPosData() {
      const cats = await db.categories.where('isActive').equals(1).toArray();
      const prods = await db.products.where('isActive').equals(1).toArray();
      const tbls = await db.diningTables.toArray();
      const mods = await db.modifiers.toArray();
      setCategories(cats);
      setProducts(prods);
      setTables(tbls);
      setAvailableModifiers(mods);
    }
    loadPosData();
  }, [activeOutlet]);

  const filteredProducts = products.filter((p) => {
    const matchCategory = selectedCategory === null || p.categoryId === selectedCategory;
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.code && p.code.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCategory && matchSearch;
  });

  const handleOpenCustomize = (product: LocalProduct) => {
    setCustomizingProduct(product);
    setSelectedItemModifiers([]);
    setItemNote('');
  };

  const handleConfirmAddToCart = () => {
    if (!customizingProduct) return;

    const modifierPriceTotal = selectedItemModifiers.reduce((sum, m) => sum + m.price, 0);
    const newItem: CartItem = {
      id: `${customizingProduct.id}_${Date.now()}`,
      product: {
        ...customizingProduct,
        basePrice: customizingProduct.basePrice + modifierPriceTotal
      },
      quantity: 1,
      modifiers: selectedItemModifiers,
      notes: itemNote.trim() || undefined
    };

    setCart((prev) => [...prev, newItem]);
    setCustomizingProduct(null);
  };

  const handleDirectQuickAdd = (product: LocalProduct) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id && (!item.modifiers || item.modifiers.length === 0));
      if (existing) {
        return prev.map((item) =>
          item.id === existing.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          id: `${product.id}_${Date.now()}`,
          product,
          quantity: 1
        }
      ];
    });
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === itemId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const clearCart = () => {
    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setDiscountAmount(0);
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.product.basePrice * item.quantity, 0);
  const effectiveDiscount = Math.min(discountAmount, subtotal);
  const taxableBase = Math.max(0, subtotal - effectiveDiscount);
  const taxRate = activeOutlet?.taxPercentage || 0;
  const taxAmount = Math.round((taxableBase * taxRate) / 100);
  const totalAmount = taxableBase + taxAmount;

  // Handle Checkout Submit
  const handleProcessPayment = async () => {
    if (cart.length === 0) return;

    const orderNumber = createNewOrderNumber();
    const syncId = createNewSyncId();
    const change = Math.max(0, cashAmount - totalAmount);

    const orderData: LocalOrder = {
      syncId,
      outletId: activeOutlet?.id || 1,
      orderNumber,
      orderType,
      tableName: orderType === 'DINE_IN' ? selectedTable : undefined,
      customerName: customerName.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      subtotal,
      discountAmount: effectiveDiscount,
      taxAmount,
      serviceChargeAmount: 0,
      totalAmount,
      paymentMethod,
      amountPaid: paymentMethod === 'CASH' ? (cashAmount || totalAmount) : totalAmount,
      changeAmount: paymentMethod === 'CASH' ? change : 0,
      status: 'PAID',
      items: cart.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        variantName: item.variantName,
        unitPrice: item.product.basePrice,
        quantity: item.quantity,
        subtotal: item.product.basePrice * item.quantity,
        modifiers: item.modifiers,
        notes: item.notes
      })),
      createdAt: new Date().toISOString(),
      isSynced: false
    };

    // 1. Save order to Local IndexedDB
    await db.orders.put(orderData);

    // 1b. Auto-deduct inventory stock based on BOM recipes
    await deductStockForLocalOrder(orderData);

    // 2. Mark Table OCCUPIED if Dine-In
    if (orderType === 'DINE_IN') {
      const tableRecord = tables.find((t) => t.tableNumber === selectedTable);
      if (tableRecord) {
        await db.diningTables.update(tableRecord.id, { status: 'OCCUPIED' });
      }
    }

    // 3. Queue for background sync to Backend/Apps Script
    await syncManager.queueItem('ORDER', 'CREATE', orderData);

    // 4. Complete and show receipt modal
    setCompletedOrder(orderData);
    setIsCheckoutOpen(false);
    clearCart();
  };

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 flex flex-col lg:flex-row gap-5">
      
      {/* LEFT: Product Catalog */}
      <div className="flex-1 flex flex-col space-y-4">
        
        {/* Search & Categories */}
        <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-stone-200 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Cari kopi, makanan, atau kode produk..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition ${
                selectedCategory === null
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              Semua Menu
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition ${
                  selectedCategory === c.id
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 overflow-y-auto max-h-[calc(100vh-220px)]">
          {filteredProducts.map((prod) => (
            <div
              key={prod.id}
              className="bg-white p-3.5 rounded-2xl shadow-sm border border-stone-200 hover:border-amber-400 hover:shadow-md transition flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    {prod.code || 'MENU'}
                  </span>
                  <button
                    onClick={() => handleOpenCustomize(prod)}
                    title="Tambah dengan Opsi/Modifier"
                    className="p-1 rounded-lg text-stone-400 hover:text-amber-700 hover:bg-amber-50 transition"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                  </button>
                </div>
                <h4 className="font-semibold text-stone-800 text-sm mt-2 leading-snug line-clamp-2">
                  {prod.name}
                </h4>
              </div>

              <div className="mt-3 pt-2 border-t border-stone-100 flex items-center justify-between">
                <span className="font-bold text-stone-900 text-xs sm:text-sm">
                  {formatCurrency(prod.basePrice)}
                </span>
                <button
                  onClick={() => handleDirectQuickAdd(prod)}
                  className="p-1.5 rounded-lg bg-amber-100 hover:bg-amber-600 text-amber-800 hover:text-white transition flex items-center gap-1 active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT: Cart Panel */}
      <div className="w-full lg:w-96 bg-white rounded-2xl shadow-sm border border-stone-200 flex flex-col h-[calc(100vh-140px)] sticky top-20">
        
        {/* Order Setup Header */}
        <div className="p-4 border-b border-stone-200 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4 text-amber-600" />
              <span>Keranjang ({cart.length})</span>
            </h3>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-stone-400 hover:text-rose-600 text-xs flex items-center gap-1 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Kosongkan</span>
              </button>
            )}
          </div>

          {/* Dine-In / Takeaway Toggle */}
          <div className="grid grid-cols-2 gap-2 bg-stone-100 p-1 rounded-xl">
            <button
              onClick={() => setOrderType('DINE_IN')}
              className={`py-1.5 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5 ${
                orderType === 'DINE_IN' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500'
              }`}
            >
              <UtensilsCrossed className="w-3.5 h-3.5" />
              <span>Dine-In</span>
            </button>
            <button
              onClick={() => setOrderType('TAKEAWAY')}
              className={`py-1.5 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5 ${
                orderType === 'TAKEAWAY' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Takeaway</span>
            </button>
          </div>

          {/* Dine-In Table Picker */}
          {orderType === 'DINE_IN' && (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-stone-500 font-medium">Nomor Meja:</span>
              <select
                aria-label="Pilih Meja"
                value={selectedTable}
                onChange={(e) => setSelectedTable(e.target.value)}
                className="flex-1 py-1 px-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
              >
                {tables.map((t) => (
                  <option key={t.id} value={t.tableNumber}>
                    {t.tableNumber} ({t.capacity} Kursi) {t.status === 'OCCUPIED' ? '• Terisi' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Cart Items List */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-stone-400 text-center space-y-2">
              <ShoppingBag className="w-10 h-10 stroke-1" />
              <p className="text-xs">Keranjang masih kosong.<br />Klik menu untuk menambahkan.</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="border-b border-stone-100 pb-2.5 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex-1 pr-2">
                    <h5 className="font-semibold text-stone-800 text-xs">{item.product.name}</h5>
                    <span className="text-[11px] text-stone-500">
                      {formatCurrency(item.product.basePrice)}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      className="p-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      className="p-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Modifiers List in Cart */}
                {item.modifiers && item.modifiers.length > 0 && (
                  <div className="text-[10px] text-amber-700 pl-2 border-l border-amber-300">
                    {item.modifiers.map((m, idx) => (
                      <span key={idx} className="mr-1.5">
                        +{m.name} ({formatCurrency(m.price)})
                      </span>
                    ))}
                  </div>
                )}
                {item.notes && (
                  <div className="text-[10px] text-stone-400 italic pl-2">
                    Catatan: {item.notes}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Calculation & Checkout Button */}
        {cart.length > 0 && (
          <div className="p-4 bg-stone-50 border-t border-stone-200 space-y-2">
            <div className="flex justify-between text-xs text-stone-600">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>

            {/* Discount Section */}
            <div className="flex justify-between items-center text-xs text-stone-600">
              <button
                onClick={() => setShowDiscountInput(!showDiscountInput)}
                className="text-[11px] text-amber-700 hover:underline flex items-center gap-1 font-medium"
              >
                <Tag className="w-3 h-3" />
                <span>{effectiveDiscount > 0 ? 'Ubah Diskon' : '+ Tambah Diskon'}</span>
              </button>
              {effectiveDiscount > 0 && (
                <span className="text-rose-600 font-semibold">
                  -{formatCurrency(effectiveDiscount)}
                </span>
              )}
            </div>

            {showDiscountInput && (
              <div className="flex gap-2 items-center bg-white p-2 rounded-xl border border-stone-200">
                <span className="text-xs text-stone-500 font-semibold">Rp</span>
                <input
                  type="number"
                  placeholder="Jumlah diskon"
                  value={discountAmount || ''}
                  onChange={(e) => setDiscountAmount(Math.max(0, Number(e.target.value)))}
                  className="flex-1 text-xs py-1 px-2 border border-stone-300 rounded-lg focus:outline-none"
                />
                <button
                  onClick={() => setShowDiscountInput(false)}
                  className="text-xs bg-stone-800 text-white px-2.5 py-1 rounded-lg font-semibold"
                >
                  Terapkan
                </button>
              </div>
            )}

            {taxAmount > 0 && (
              <div className="flex justify-between text-xs text-stone-600">
                <span>Pajak ({taxRate}%)</span>
                <span>{formatCurrency(taxAmount)}</span>
              </div>
            )}

            <div className="flex justify-between text-sm font-bold text-stone-900 pt-1 border-t border-stone-200">
              <span>Total Tagihan</span>
              <span className="text-amber-800">{formatCurrency(totalAmount)}</span>
            </div>

            <button
              onClick={() => {
                setCashAmount(totalAmount);
                setIsCheckoutOpen(true);
              }}
              className="w-full mt-2 bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 px-4 rounded-xl text-sm shadow-md transition flex items-center justify-center gap-2"
            >
              <span>Bayar Pesanan</span>
              <span>({formatCurrency(totalAmount)})</span>
            </button>
          </div>
        )}
      </div>

      {/* ITEM CUSTOMIZATION MODAL */}
      {customizingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="font-bold text-stone-900 text-sm">{customizingProduct.name}</h3>
                <span className="text-xs text-amber-700 font-bold">
                  {formatCurrency(customizingProduct.basePrice)}
                </span>
              </div>
              <button onClick={() => setCustomizingProduct(null)}>
                <X className="w-5 h-5 text-stone-400" />
              </button>
            </div>

            {/* Modifiers checklist */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-stone-700">Pilih Modifier / Tambahan:</label>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {availableModifiers.map((mod) => {
                  const isSelected = selectedItemModifiers.some((m) => m.name === mod.name);
                  return (
                    <label
                      key={mod.id}
                      className={`flex items-center justify-between p-2 rounded-xl border text-xs cursor-pointer transition ${
                        isSelected
                          ? 'border-amber-600 bg-amber-50 text-amber-900 font-semibold'
                          : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedItemModifiers((prev) => [...prev, { name: mod.name, price: mod.price }]);
                            } else {
                              setSelectedItemModifiers((prev) => prev.filter((m) => m.name !== mod.name));
                            }
                          }}
                          className="rounded text-amber-600 focus:ring-0"
                        />
                        <span>{mod.name}</span>
                      </div>
                      <span className="text-stone-500 font-medium">+{formatCurrency(mod.price)}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Custom Notes */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Catatan Khusus Barista:</label>
              <input
                type="text"
                placeholder="Contoh: Less sugar, extra ice, pisahkan saus"
                value={itemNote}
                onChange={(e) => setItemNote(e.target.value)}
                className="w-full text-xs p-2 border border-stone-300 rounded-lg focus:outline-none"
              />
            </div>

            <div className="flex gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setCustomizingProduct(null)}
                className="flex-1 py-2 text-xs text-stone-600 hover:bg-stone-100 rounded-xl"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmAddToCart}
                className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md"
              >
                Tambah ke Keranjang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHECKOUT MODAL */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-stone-900 text-base">Pembayaran Kasir</h3>
              <span className="text-amber-800 font-bold text-base">{formatCurrency(totalAmount)}</span>
            </div>

            {/* Customer Details */}
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Nama Pelanggan (opsional)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full text-xs p-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
              <input
                type="tel"
                placeholder="No. WhatsApp Pelanggan (untuk e-struk)"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full text-xs p-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            {/* Payment Methods */}
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1.5">Metode Pembayaran:</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setPaymentMethod('CASH')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition ${
                    paymentMethod === 'CASH'
                      ? 'border-amber-600 bg-amber-50 text-amber-900 ring-1 ring-amber-600'
                      : 'border-stone-200 text-stone-600'
                  }`}
                >
                  <DollarSign className="w-4 h-4" />
                  <span>Tunai</span>
                </button>
                <button
                  onClick={() => setPaymentMethod('QRIS')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition ${
                    paymentMethod === 'QRIS'
                      ? 'border-amber-600 bg-amber-50 text-amber-900 ring-1 ring-amber-600'
                      : 'border-stone-200 text-stone-600'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  <span>QRIS</span>
                </button>
                <button
                  onClick={() => setPaymentMethod('BANK_TRANSFER')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition ${
                    paymentMethod === 'BANK_TRANSFER'
                      ? 'border-amber-600 bg-amber-50 text-amber-900 ring-1 ring-amber-600'
                      : 'border-stone-200 text-stone-600'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Transfer</span>
                </button>
              </div>
            </div>

            {/* Cash Input & Quick Amounts */}
            {paymentMethod === 'CASH' && (
              <div className="space-y-2 bg-stone-50 p-3 rounded-xl border border-stone-200">
                <label className="block text-xs font-medium text-stone-700">Jumlah Uang Diterima:</label>
                <input
                  type="number"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(Number(e.target.value))}
                  className="w-full text-base font-bold p-2 border border-stone-300 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-amber-500"
                />

                <div className="flex gap-1.5 pt-1">
                  <button
                    onClick={() => setCashAmount(totalAmount)}
                    className="flex-1 py-1 text-[11px] bg-white border border-stone-300 rounded-lg hover:bg-stone-100 font-medium"
                  >
                    Uang Pas
                  </button>
                  <button
                    onClick={() => setCashAmount(50000)}
                    className="flex-1 py-1 text-[11px] bg-white border border-stone-300 rounded-lg hover:bg-stone-100 font-medium"
                  >
                    50.000
                  </button>
                  <button
                    onClick={() => setCashAmount(100000)}
                    className="flex-1 py-1 text-[11px] bg-white border border-stone-300 rounded-lg hover:bg-stone-100 font-medium"
                  >
                    100.000
                  </button>
                </div>

                <div className="flex justify-between items-center text-xs font-bold pt-2 border-t text-stone-800">
                  <span>Kembalian:</span>
                  <span className="text-emerald-700 text-sm">
                    {formatCurrency(Math.max(0, cashAmount - totalAmount))}
                  </span>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="flex-1 py-2 text-xs font-medium text-stone-600 hover:bg-stone-100 rounded-xl transition"
              >
                Batal
              </button>
              <button
                onClick={handleProcessPayment}
                className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Selesaikan Transaksi</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COMPLETED RECEIPT MODAL */}
      {completedOrder && (
        <ReceiptModal order={completedOrder} onClose={() => setCompletedOrder(null)} />
      )}
    </div>
  );
};
