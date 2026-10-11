import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import {
  formatRupiah,
  generateInvoiceNumber,
  generateIdempotencyKey
} from '../services/utils';
import { openWhatsAppReceipt, createWhatsAppReceiptMessage } from '../services/whatsappService';
import { printThermalReceipt } from '../services/printService';
import { SyncEngine } from '../services/syncEngine';
import {
  ShoppingBag,
  User,
  Plus,
  Minus,
  Trash2,
  Printer,
  MessageSquare,
  Copy,
  CheckCircle2,
  X,
  CreditCard,
  Banknote,
  QrCode
} from 'lucide-react';
import type {
  ServiceItem,
  ProductItem,
  Barber,
  Customer,
  TransactionCartItem,
  Transaction,
  PaymentMethod
} from '../types';

export const PosPage: React.FC = () => {
  const { showToast, settings } = useApp();

  // Master Data
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Cart & Transaction State
  const [cart, setCart] = useState<TransactionCartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [guestName, setGuestName] = useState('Pelanggan Umum');
  const [guestPhone, setGuestPhone] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [cashGiven, setCashGiven] = useState<number>(0);

  // Active Category Filter
  const [itemTypeTab, setItemTypeTab] = useState<'ALL' | 'SERVICE' | 'PRODUCT'>('ALL');
  const [selectedBarberForServices, setSelectedBarberForServices] = useState<string>('');

  // UI Modal State
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedTransaction, setCompletedTransaction] = useState<Transaction | null>(null);

  const loadData = async () => {
    const sList = await db.services.filter(s => s.isActive).toArray();
    const pList = await db.products.filter(p => p.isActive).toArray();
    const bList = await db.barbers.filter(b => b.isActive).toArray();
    const cList = await db.customers.toArray();

    setServices(sList);
    setProducts(pList);
    setBarbers(bList);
    setCustomers(cList);

    if (bList.length > 0 && !selectedBarberForServices) {
      setSelectedBarberForServices(bList[0].id);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Hitung komisi snapshot untuk layanan
  const calculateCommissionSnapshot = (price: number, barberId?: string) => {
    if (!barberId) return { type: 'NONE', value: 0, calculated: 0 };
    const b = barbers.find(item => item.id === barberId);
    if (!b) return { type: 'NONE', value: 0, calculated: 0 };

    let cType = b.commissionType;
    let cValue = b.commissionValue;

    if (cType === 'DEFAULT') {
      cType = settings?.defaultCommissionType || 'PERCENTAGE';
      cValue = settings?.defaultCommissionValue || 35;
    }

    let calculated = 0;
    if (cType === 'PERCENTAGE') {
      calculated = Math.round((price * cValue) / 100);
    } else {
      calculated = cValue;
    }

    return { type: cType, value: cValue, calculated };
  };

  // Add Service to Cart
  const addServiceToCart = (service: ServiceItem) => {
    const barber = barbers.find(b => b.id === selectedBarberForServices);
    const comm = calculateCommissionSnapshot(service.price, selectedBarberForServices);

    const newItem: TransactionCartItem = {
      id: 'cart_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      type: 'SERVICE',
      referenceId: service.id,
      name: service.name,
      price: service.price,
      costPrice: 0,
      quantity: 1,
      barberId: barber?.id,
      barberName: barber?.name,
      commissionTypeSnapshot: comm.type,
      commissionValueSnapshot: comm.value,
      calculatedCommission: comm.calculated,
      subtotal: service.price
    };

    setCart(prev => [...prev, newItem]);
    showToast(`Ditambahkan: ${service.name}`, 'info');
  };

  // Add Product to Cart
  const addProductToCart = (product: ProductItem) => {
    if (product.stock <= 0) {
      showToast(`Stok ${product.name} telah habis!`, 'error');
      return;
    }

    const existingIndex = cart.findIndex(it => it.type === 'PRODUCT' && it.referenceId === product.id);
    if (existingIndex > -1) {
      const existing = cart[existingIndex];
      if (existing.quantity >= product.stock) {
        showToast(`Stok ${product.name} hanya tersisa ${product.stock} pcs!`, 'error');
        return;
      }
      const updatedCart = [...cart];
      updatedCart[existingIndex] = {
        ...existing,
        quantity: existing.quantity + 1,
        subtotal: (existing.quantity + 1) * existing.price
      };
      setCart(updatedCart);
    } else {
      const newItem: TransactionCartItem = {
        id: 'cart_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        type: 'PRODUCT',
        referenceId: product.id,
        name: product.name,
        price: product.sellingPrice,
        costPrice: product.costPrice,
        quantity: 1,
        subtotal: product.sellingPrice
      };
      setCart(prev => [...prev, newItem]);
    }

    showToast(`Ditambahkan: ${product.name}`, 'info');
  };

  const updateCartQty = (cartId: string, delta: number) => {
    const target = cart.find(c => c.id === cartId);
    if (!target) return;

    if (target.type === 'PRODUCT') {
      const product = products.find(p => p.id === target.referenceId);
      const newQty = target.quantity + delta;
      if (product && newQty > product.stock) {
        showToast(`Stok maksimal ${product.stock} pcs`, 'error');
        return;
      }
    }

    setCart(prev =>
      prev
        .map(it => {
          if (it.id === cartId) {
            const nextQty = it.quantity + delta;
            return nextQty > 0
              ? {
                  ...it,
                  quantity: nextQty,
                  subtotal: nextQty * it.price,
                  calculatedCommission: it.calculatedCommission ? it.calculatedCommission * nextQty : 0
                }
              : null;
          }
          return it;
        })
        .filter(Boolean) as TransactionCartItem[]
    );
  };

  const removeFromCart = (cartId: string) => {
    setCart(prev => prev.filter(it => it.id !== cartId));
  };

  // Calculations
  const subtotal = cart.reduce((sum, it) => sum + it.subtotal, 0);
  const totalAmount = Math.max(0, subtotal - discountAmount);
  const changeAmount = paymentMethod === 'CASH' ? Math.max(0, cashGiven - totalAmount) : 0;

  // Open Checkout
  const handleOpenCheckout = () => {
    if (cart.length === 0) {
      showToast('Keranjang kasir masih kosong', 'error');
      return;
    }
    setCashGiven(totalAmount);
    setIsCheckoutModalOpen(true);
  };

  // Submit Transaction (Anti Double-Click)
  const handleProcessPayment = async () => {
    if (isSubmitting) return; // Prevent double submit

    if (paymentMethod === 'CASH' && cashGiven < totalAmount) {
      showToast('Uang pembayaran kurang dari total tagihan!', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const invoiceNumber = generateInvoiceNumber();
      const idempotencyKey = generateIdempotencyKey();
      const custName = selectedCustomer ? selectedCustomer.name : (guestName.trim() || 'Pelanggan Umum');
      const custPhone = selectedCustomer ? selectedCustomer.phone : guestPhone.trim();

      const transaction: Transaction = {
        id: 'tx_' + Date.now(),
        idempotencyKey,
        invoiceNumber,
        customerId: selectedCustomer?.id,
        customerName: custName,
        customerPhone: custPhone,
        cashierName: 'Kasir',
        items: cart,
        subtotal,
        discountAmount,
        totalAmount,
        paymentMethod,
        amountPaid: paymentMethod === 'CASH' ? cashGiven : totalAmount,
        changeAmount,
        status: 'COMPLETED',
        createdAt: new Date().toISOString()
      };

      // 1. Simpan Transaksi ke IndexedDB Lokal
      await db.transactions.put(transaction);

      // 2. Kurangi stok produk retail lokal
      for (const item of cart) {
        if (item.type === 'PRODUCT') {
          const product = products.find(p => p.id === item.referenceId);
          if (product) {
            const nextStock = Math.max(0, product.stock - item.quantity);
            await db.products.update(product.id, {
              stock: nextStock,
              updatedAt: new Date().toISOString()
            });
          }
        }
      }

      // 3. Update data belanja pelanggan jika ada
      if (selectedCustomer) {
        await db.customers.update(selectedCustomer.id, {
          totalVisits: (selectedCustomer.totalVisits || 0) + 1,
          totalSpent: (selectedCustomer.totalSpent || 0) + totalAmount,
          lastVisitAt: new Date().toISOString()
        });
      }

      // 4. Masukkan ke Outbox Sync Queue
      await SyncEngine.addToOutbox('TRANSACTION', 'CREATE', transaction);

      // Reload data produk & pelanggan
      await loadData();

      // Reset state keranjang & buka dialog struk
      setCart([]);
      setDiscountAmount(0);
      setIsCheckoutModalOpen(false);
      setCompletedTransaction(transaction);
      showToast(`Transaksi ${invoiceNumber} Berhasil!`, 'success');
    } catch (err: any) {
      showToast('Gagal memproses transaksi: ' + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrintReceipt = () => {
    if (completedTransaction && settings) {
      printThermalReceipt(completedTransaction, settings);
    }
  };

  const handleCopyReceiptText = async () => {
    if (!completedTransaction || !settings) return;
    const text = createWhatsAppReceiptMessage(completedTransaction, settings);
    try {
      await navigator.clipboard.writeText(text);
      showToast('Teks struk berhasil disalin ke clipboard!', 'success');
    } catch {
      // Fallback manual copy
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      showToast('Teks struk berhasil disalin!', 'success');
    }
  };

  return (
    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* LEFT: Item Selection (Services & Products) */}
      <div className="lg:col-span-7 space-y-4">
        {/* Barber Selector for Services */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-semibold text-neutral-300">Barber Bertugas:</span>
          </div>
          <select
            value={selectedBarberForServices}
            onChange={e => setSelectedBarberForServices(e.target.value)}
            className="bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-neutral-100 font-bold focus:border-amber-500 focus:outline-none"
          >
            {barbers.map(b => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        {/* Tab Filter: Semua | Layanan | Produk */}
        <div className="flex items-center gap-2 border-b border-neutral-800 pb-2">
          {[
            { id: 'ALL', label: 'Semua Item' },
            { id: 'SERVICE', label: '✂️ Layanan Cukur' },
            { id: 'PRODUCT', label: '🧴 Produk Retail' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setItemTypeTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                itemTypeTab === tab.id
                  ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20'
                  : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200 border border-neutral-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Grid List Item */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {/* Services */}
          {(itemTypeTab === 'ALL' || itemTypeTab === 'SERVICE') &&
            services.map(srv => (
              <button
                key={srv.id}
                onClick={() => addServiceToCart(srv)}
                className="bg-neutral-900/90 hover:bg-neutral-800/90 border border-neutral-800 hover:border-amber-500/50 p-3.5 rounded-2xl text-left flex flex-col justify-between h-28 transition-all group active:scale-95"
              >
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded">
                    {srv.category}
                  </span>
                  <h4 className="font-bold text-xs text-neutral-100 mt-1 line-clamp-2 leading-snug">
                    {srv.name}
                  </h4>
                </div>
                <div className="font-extrabold text-sm text-neutral-200 group-hover:text-amber-400">
                  {formatRupiah(srv.price)}
                </div>
              </button>
            ))}

          {/* Products */}
          {(itemTypeTab === 'ALL' || itemTypeTab === 'PRODUCT') &&
            products.map(prd => {
              const outOfStock = prd.stock <= 0;
              return (
                <button
                  key={prd.id}
                  disabled={outOfStock}
                  onClick={() => addProductToCart(prd)}
                  className={`border p-3.5 rounded-2xl text-left flex flex-col justify-between h-28 transition-all group active:scale-95 ${
                    outOfStock
                      ? 'bg-neutral-950/60 border-neutral-900 opacity-40 cursor-not-allowed'
                      : 'bg-neutral-900/90 hover:bg-neutral-800/90 border-neutral-800 hover:border-amber-500/50'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                        {prd.category}
                      </span>
                      <span
                        className={`text-[10px] font-bold ${
                          outOfStock ? 'text-rose-400' : 'text-neutral-400'
                        }`}
                      >
                        {outOfStock ? 'Habis' : `${prd.stock} pcs`}
                      </span>
                    </div>
                    <h4 className="font-bold text-xs text-neutral-100 mt-1 line-clamp-2 leading-snug">
                      {prd.name}
                    </h4>
                  </div>
                  <div className="font-extrabold text-sm text-neutral-200 group-hover:text-amber-400">
                    {formatRupiah(prd.sellingPrice)}
                  </div>
                </button>
              );
            })}
        </div>
      </div>

      {/* RIGHT: Cart & Checkout Summary */}
      <div className="lg:col-span-5 bg-neutral-900/95 border border-neutral-800 rounded-3xl p-5 space-y-4 shadow-xl sticky top-20">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <h3 className="font-bold text-sm text-neutral-100 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-amber-500" />
            Keranjang Transaksi ({cart.length})
          </h3>
          {cart.length > 0 && (
            <button
              onClick={() => setCart([])}
              className="text-xs text-rose-400 hover:text-rose-300 font-medium"
            >
              Kosongkan
            </button>
          )}
        </div>

        {/* Customer Selection */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-neutral-300">
            Pelanggan:
          </label>
          <div className="flex gap-2">
            <select
              value={selectedCustomer?.id || ''}
              onChange={e => {
                const found = customers.find(c => c.id === e.target.value);
                setSelectedCustomer(found || null);
              }}
              className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-100 focus:border-amber-500 focus:outline-none"
            >
              <option value="">Pelanggan Umum (Guest / Walk-in)</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.phone ? `(${c.phone})` : ''}
                </option>
              ))}
            </select>
          </div>

          {!selectedCustomer && (
            <div className="grid grid-cols-2 gap-2 pt-1">
              <input
                type="text"
                placeholder="Nama Tamu"
                value={guestName}
                onChange={e => setGuestName(e.target.value)}
                className="bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-neutral-100 placeholder-neutral-600 focus:border-amber-500 focus:outline-none"
              />
              <input
                type="tel"
                placeholder="No WhatsApp (08xxx)"
                value={guestPhone}
                onChange={e => setGuestPhone(e.target.value)}
                className="bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-neutral-100 placeholder-neutral-600 focus:border-amber-500 focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* Cart Item List */}
        <div className="max-h-64 overflow-y-auto space-y-2.5 pr-1 divide-y divide-neutral-800/60">
          {cart.length === 0 ? (
            <div className="text-center py-8 text-neutral-500 text-xs">
              Belum ada layanan atau produk yang dipilih.
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="pt-2 flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h5 className="font-bold text-xs text-neutral-100 truncate">
                    {item.name}
                  </h5>
                  <div className="text-[11px] text-neutral-400 mt-0.5">
                    {item.barberName && (
                      <span className="text-amber-500 mr-1.5">[{item.barberName}]</span>
                    )}
                    {formatRupiah(item.price)}
                  </div>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-1.5 bg-neutral-950 border border-neutral-800 rounded-lg p-0.5">
                  <button
                    onClick={() => updateCartQty(item.id, -1)}
                    className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-neutral-100"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-xs font-bold px-1.5 text-neutral-200">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateCartQty(item.id, 1)}
                    className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-neutral-100"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <div className="text-right min-w-[70px]">
                  <span className="text-xs font-extrabold text-neutral-100 block">
                    {formatRupiah(item.subtotal)}
                  </span>
                </div>

                <button
                  onClick={() => removeFromCart(item.id)}
                  className="p-1 text-neutral-500 hover:text-rose-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Price Calculations */}
        <div className="pt-3 border-t border-neutral-800 space-y-2 text-xs">
          <div className="flex justify-between text-neutral-400">
            <span>Subtotal:</span>
            <span className="font-semibold text-neutral-200">{formatRupiah(subtotal)}</span>
          </div>

          <div className="flex justify-between items-center text-neutral-400">
            <span>Diskon (Rp):</span>
            <input
              type="number"
              min="0"
              max={subtotal}
              step="5000"
              value={discountAmount}
              onChange={e => setDiscountAmount(Math.min(subtotal, Math.max(0, Number(e.target.value))))}
              className="w-24 bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-1 text-right text-xs text-neutral-100 font-bold focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="pt-2 border-t border-neutral-800 flex justify-between items-center text-sm font-extrabold">
            <span className="text-neutral-100">Total Tagihan:</span>
            <span className="text-lg text-amber-400">{formatRupiah(totalAmount)}</span>
          </div>
        </div>

        {/* Checkout Button */}
        <Button
          variant="gold"
          size="lg"
          className="w-full"
          disabled={cart.length === 0}
          onClick={handleOpenCheckout}
        >
          Bayar Sekarang ({formatRupiah(totalAmount)})
        </Button>
      </div>

      {/* Checkout Modal */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="text-base font-bold text-neutral-100">
                Penyelesaian Pembayaran
              </h3>
              <button
                onClick={() => setIsCheckoutModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-neutral-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-center p-4 bg-neutral-950 border border-neutral-800 rounded-2xl">
              <span className="text-xs text-neutral-400">Total yang harus dibayar:</span>
              <h2 className="text-2xl font-black text-amber-400 mt-1">
                {formatRupiah(totalAmount)}
              </h2>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-neutral-300">
                Metode Pembayaran:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'CASH', label: 'Tunai', icon: Banknote },
                  { id: 'QRIS', label: 'QRIS', icon: QrCode },
                  { id: 'TRANSFER', label: 'Transfer', icon: CreditCard }
                ].map(item => {
                  const Icon = item.icon;
                  const isSelected = paymentMethod === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setPaymentMethod(item.id as PaymentMethod)}
                      className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                        isSelected
                          ? 'bg-amber-500 text-neutral-950 border-amber-400 font-bold shadow-md shadow-amber-500/20'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700 font-medium'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-xs">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Cash Input */}
            {paymentMethod === 'CASH' && (
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-neutral-300">
                  Uang Tunai Diterima (Rp):
                </label>
                <input
                  type="number"
                  min={totalAmount}
                  step="5000"
                  value={cashGiven}
                  onChange={e => setCashGiven(Number(e.target.value))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-lg font-black text-emerald-400 focus:border-amber-500 focus:outline-none"
                />

                {/* Quick Cash Buttons */}
                <div className="flex gap-1.5 overflow-x-auto pt-1">
                  {[totalAmount, 50000, 100000, 150000, 200000].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setCashGiven(val)}
                      className="px-2.5 py-1 rounded-lg bg-neutral-950 border border-neutral-800 text-[11px] font-bold text-neutral-300 hover:text-amber-400 hover:border-amber-500/50"
                    >
                      {formatRupiah(val)}
                    </button>
                  ))}
                </div>

                <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl flex items-center justify-between text-xs mt-2">
                  <span className="text-neutral-400">Kembalian:</span>
                  <span className="text-base font-extrabold text-emerald-400">
                    {formatRupiah(changeAmount)}
                  </span>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2.5 pt-3 border-t border-neutral-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCheckoutModalOpen(false)}
              >
                Batal
              </Button>
              <Button
                variant="gold"
                isLoading={isSubmitting}
                loadingText="Memproses Transaksi..."
                onClick={handleProcessPayment}
              >
                Selesaikan Pembayaran
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Success Dialog (Print & WhatsApp) */}
      {completedTransaction && (
        <div className="fixed inset-0 bg-neutral-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl text-center">
            <div className="w-14 h-14 bg-emerald-500/20 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-neutral-100">
                Transaksi Berhasil!
              </h3>
              <p className="text-xs text-neutral-400 font-mono mt-1">
                {completedTransaction.invoiceNumber}
              </p>
              <p className="text-xl font-black text-amber-400 mt-2">
                {formatRupiah(completedTransaction.totalAmount)}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handlePrintReceipt}
                className="flex items-center justify-center gap-1.5 text-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                Cetak Struk
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyReceiptText}
                className="flex items-center justify-center gap-1.5 text-xs text-neutral-200"
              >
                <Copy className="w-3.5 h-3.5 text-amber-400" />
                Salin Teks
              </Button>

              <Button
                variant="gold"
                size="sm"
                onClick={() => {
                  if (settings) openWhatsAppReceipt(completedTransaction, settings);
                }}
                className="flex items-center justify-center gap-1.5 text-xs"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Kirim WA
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCompletedTransaction(null)}
              className="w-full"
            >
              Transaksi Baru
            </Button>
          </div>

          {/* Hidden Printable Thermal Receipt Container */}
          <div id="printable-receipt" className="hidden">
            <div style={{ width: '58mm', fontFamily: 'monospace', fontSize: '11px', padding: '5px' }}>
              <center>
                <strong>{settings?.shopName || 'BARBERSHOP'}</strong><br />
                {settings?.address || ''}<br />
                Telp: {settings?.phone || ''}<br />
                ================================<br />
              </center>
              No: {completedTransaction.invoiceNumber}<br />
              Tgl: {new Date(completedTransaction.createdAt).toLocaleString('id-ID')}<br />
              Plg: {completedTransaction.customerName}<br />
              Kasir: {completedTransaction.cashierName}<br />
              --------------------------------<br />
              {completedTransaction.items.map((it, idx) => (
                <div key={idx}>
                  {it.quantity}x {it.name} {it.barberName ? `(${it.barberName})` : ''}<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;= {formatRupiah(it.subtotal)}
                </div>
              ))}
              --------------------------------<br />
              Subtotal: {formatRupiah(completedTransaction.subtotal)}<br />
              Diskon: {formatRupiah(completedTransaction.discountAmount)}<br />
              TOTAL: {formatRupiah(completedTransaction.totalAmount)}<br />
              Bayar ({completedTransaction.paymentMethod}): {formatRupiah(completedTransaction.amountPaid)}<br />
              Kembali: {formatRupiah(completedTransaction.changeAmount)}<br />
              ================================<br />
              <center>
                {settings?.receiptFooter || 'Terima kasih atas kunjungan Anda!'}<br />
              </center>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
