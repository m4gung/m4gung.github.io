import React, { useState } from 'react';
import { 
  ShoppingCart, 
  Search, 
  Barcode, 
  Plus, 
  Minus, 
  Trash2, 
  Banknote, 
  QrCode, 
  CreditCard, 
  Calendar, 
  CheckCircle2, 
  Printer, 
  Copy, 
  X, 
  User,
  AlertCircle
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatRupiah, formatTanggal } from '../utils/format';
import type { Product, PaymentMethod } from '../types';

interface CartItem {
  product: Product;
  quantity: number;
}

export const KasirPage: React.FC = () => {
  const { products, categories, customers, settings, provider, refreshData } = useStore();

  // State Keranjang Belanja
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');

  // State Pencarian & Scanner
  const [searchQuery, setSearchQuery] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // State Modal Checkout
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customers[0]?.id || '');
  const [dueDate, setDueDate] = useState<string>(
    new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10)
  );

  // State Struk Sukses
  const [completedSale, setCompletedSale] = useState<any | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [copiedBank, setCopiedBank] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Filter Produk di Katalog Kasir
  const filteredProducts = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.barcode && p.barcode.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchCategory = selectedCategory === 'ALL' || p.category === selectedCategory;
    return matchSearch && matchCategory;
  });

  // Tambah Produk ke Keranjang (Klik Kartu atau Barcode)
  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      alert(`Stok "${product.name}" habis!`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          alert(`Jumlah melebihi stok yang tersedia (${product.stock} ${product.unit})`);
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  // Handler Scanner Barcode Gun (Input Enter)
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const code = barcodeInput.trim();
    const found = products.find(
      (p) => (p.barcode && p.barcode === code) || p.sku.toLowerCase() === code.toLowerCase()
    );

    if (found) {
      addToCart(found);
      setBarcodeInput('');
    } else {
      alert(`Produk dengan barcode/SKU "${code}" tidak ditemukan!`);
    }
  };

  // Update Kuantitas
  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > item.product.stock) {
              alert(`Maksimal stok tersedia: ${item.product.stock} ${item.product.unit}`);
              return item;
            }
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    if (cart.length > 0 && confirm('Kosongkan keranjang belanja?')) {
      setCart([]);
      setDiscountAmount(0);
      setNotes('');
    }
  };

  // Kalkulasi Keuangan Kasir
  const subtotal = cart.reduce(
    (sum, item) => sum + item.product.sellingPrice * item.quantity,
    0
  );
  const finalTotal = Math.max(0, subtotal - discountAmount);
  const changeAmount = Math.max(0, cashReceived - finalTotal);

  // Buka Modal Checkout
  const handleOpenCheckout = () => {
    if (cart.length === 0) {
      alert('Keranjang belanja masih kosong!');
      return;
    }
    setPaymentMethod('CASH');
    setCashReceived(finalTotal); // default pas
    setIsCheckoutModalOpen(true);
  };

  // Salin Nomor Rekening
  const handleCopyAccountNo = () => {
    if (settings.bankAccountNo) {
      navigator.clipboard.writeText(settings.bankAccountNo);
      setCopiedBank(true);
      setTimeout(() => setCopiedBank(false), 2000);
    }
  };

  // Eksekusi Transaksi Checkout Kasir
  const handleProcessCheckout = async () => {
    if (paymentMethod === 'CASH' && cashReceived < finalTotal) {
      alert('Jumlah uang tunai yang diterima kurang dari total belanja!');
      return;
    }

    setProcessing(true);
    try {
      const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);
      const customerName =
        paymentMethod === 'CREDIT' ? selectedCustomer?.name || 'Pelanggan Kredit' : 'Pelanggan Umum';

      const checkoutPayload = {
        totalAmount: subtotal,
        discount: discountAmount,
        finalAmount: finalTotal,
        paymentMethod,
        cashReceived: paymentMethod === 'CASH' ? cashReceived : finalTotal,
        changeAmount: paymentMethod === 'CASH' ? changeAmount : 0,
        paymentStatus: (paymentMethod === 'CREDIT' ? 'UNPAID' : 'PAID') as 'PAID' | 'UNPAID',
        notes,
        customerId: paymentMethod === 'CREDIT' ? selectedCustomerId : undefined,
        customerName,
        dueDate: paymentMethod === 'CREDIT' ? dueDate : undefined,
        items: cart.map((item) => ({
          productId: item.product.id,
          productName: item.product.name,
          costPrice: item.product.costPrice,
          sellingPrice: item.product.sellingPrice,
          quantity: item.quantity
        }))
      };

      const result = await provider.checkoutSale(checkoutPayload);
      await refreshData();

      // Simpan data untuk cetak struk
      setCompletedSale({
        ...checkoutPayload,
        invoiceNo: result.invoiceNo,
        date: new Date().toISOString()
      });

      // Reset Keranjang
      setCart([]);
      setDiscountAmount(0);
      setNotes('');
      setIsCheckoutModalOpen(false);
      setIsReceiptModalOpen(true);
    } catch (err: any) {
      alert('Gagal memproses transaksi kasir: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  // Cetak Struk Kasir
  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 pb-24 md:pb-12">
      {/* Header & Barcode Scanner */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Kasir Penjualan (POS)</h2>
          <p className="text-xs text-gray-500">Transaksi cepat & multi-metode pembayaran</p>
        </div>

        {/* Input Barcode Scanner */}
        <form onSubmit={handleBarcodeSubmit} className="flex items-center gap-2">
          <div className="relative">
            <Barcode className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              placeholder="Scan Barcode / Tekan Enter..."
              className="pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none w-56 sm:w-64 font-mono shadow-sm"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl shadow-sm"
          >
            Input
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* KOLOM KIRI: KATALOG PRODUK CEPAT (7 Kolom) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Filter & Search Bar */}
          <div className="bg-white p-3 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama barang..."
                className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold bg-gray-50 border border-gray-200 rounded-lg text-gray-700 focus:outline-none"
            >
              <option value="ALL">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Grid Kartu Produk */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[calc(100vh-250px)] overflow-y-auto p-1">
            {filteredProducts.map((p) => {
              const isOutOfStock = p.stock <= 0;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => addToCart(p)}
                  disabled={isOutOfStock}
                  className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between shadow-sm active:scale-95 ${
                    isOutOfStock
                      ? 'bg-gray-100 border-gray-200 opacity-60 cursor-not-allowed'
                      : 'bg-white border-gray-200 hover:border-brand-500 hover:shadow-md cursor-pointer'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between text-[10px] text-gray-400 font-bold uppercase mb-1">
                      <span className="truncate">{p.category}</span>
                      <span className={p.stock <= p.minStock ? 'text-amber-600 font-bold' : 'text-gray-500'}>
                        {p.stock} {p.unit}
                      </span>
                    </div>
                    <h4 className="text-xs sm:text-sm font-semibold text-gray-900 line-clamp-2">
                      {p.name}
                    </h4>
                  </div>
                  <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-bold text-brand-600">
                      {formatRupiah(p.sellingPrice)}
                    </span>
                    <span className="p-1 rounded-md bg-brand-50 text-brand-600">
                      <Plus className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* KOLOM KANAN: KERANJANG BELANJA & CHECKOUT (5 Kolom) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-gray-200 shadow-md p-4 sm:p-5 flex flex-col justify-between min-h-[580px]">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-brand-600" />
                <h3 className="font-bold text-gray-900 text-base">Keranjang Kasir</h3>
                <span className="text-xs bg-brand-100 text-brand-800 font-bold px-2 py-0.5 rounded-full">
                  {cart.length} Item
                </span>
              </div>
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-xs text-rose-600 hover:text-rose-700 font-medium"
                >
                  Kosongkan
                </button>
              )}
            </div>

            {/* List Item Keranjang */}
            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1 divide-y divide-gray-50">
              {cart.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">Keranjang masih kosong</p>
                  <p className="text-[11px] text-gray-400">Pilih barang dari katalog atau scan barcode</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.product.id} className="pt-2 flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-semibold text-gray-900 truncate">
                        {item.product.name}
                      </h4>
                      <p className="text-[11px] text-gray-500">
                        {formatRupiah(item.product.sellingPrice)} × {item.quantity}
                      </p>
                    </div>

                    {/* Controller Qty */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.product.id, -1)}
                        className="w-6 h-6 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 text-xs font-bold"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold w-6 text-center">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.product.id, 1)}
                        className="w-6 h-6 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 text-xs font-bold"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.product.id)}
                        className="p-1 text-gray-400 hover:text-rose-600 ml-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-right font-bold text-xs text-gray-900 w-20">
                      {formatRupiah(item.product.sellingPrice * item.quantity)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Rincian Total & Tombol Bayar */}
          <div className="pt-4 border-t border-gray-100 space-y-3 mt-4">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>Subtotal:</span>
              <span className="font-semibold text-gray-900">{formatRupiah(subtotal)}</span>
            </div>

            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="text-gray-600">Diskon Toko (Rp):</span>
              <input
                type="number"
                min="0"
                value={discountAmount || ''}
                onChange={(e) => setDiscountAmount(Math.max(0, Number(e.target.value)))}
                placeholder="0"
                className="w-24 px-2 py-1 text-right text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-gray-200 text-base font-extrabold text-gray-900">
              <span>Total Tagihan:</span>
              <span className="text-brand-700 text-lg">{formatRupiah(finalTotal)}</span>
            </div>

            <button
              type="button"
              onClick={handleOpenCheckout}
              disabled={cart.length === 0}
              className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-2xl shadow-lg transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <Banknote className="w-5 h-5" />
              Proses Pembayaran ({formatRupiah(finalTotal)})
            </button>
          </div>
        </div>
      </div>

      {/* MODAL CHECKOUT PEMBAYARAN TERPADU */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Pembayaran Kasir</h3>
                <p className="text-xs text-gray-500">Pilih metode pembayaran yang digunakan pelanggan</p>
              </div>
              <button
                onClick={() => setIsCheckoutModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Total Tagihan Banner */}
            <div className="p-4 bg-brand-50/70 border border-brand-200 rounded-2xl mb-4 text-center">
              <span className="text-xs text-brand-700 font-semibold uppercase tracking-wider">
                Total yang Harus Dibayar
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-brand-700 mt-0.5">
                {formatRupiah(finalTotal)}
              </div>
            </div>

            {/* Tabs Metode Pembayaran */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[
                { id: 'CASH', label: 'Tunai', icon: Banknote },
                { id: 'QRIS', label: 'QRIS', icon: QrCode },
                { id: 'TRANSFER', label: 'Transfer', icon: CreditCard },
                { id: 'CREDIT', label: 'Piutang', icon: Calendar },
              ].map((m) => {
                const Icon = m.icon;
                const isSelected = paymentMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id as PaymentMethod)}
                    className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-xl text-xs font-bold border transition-all ${
                      isSelected
                        ? 'bg-brand-600 text-white border-brand-600 shadow-md'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4 mb-1" />
                    {m.label}
                  </button>
                );
              })}
            </div>

            {/* KONTEN METODE 1: TUNAI (CASH) */}
            {paymentMethod === 'CASH' && (
              <div className="space-y-3 p-4 bg-gray-50 rounded-2xl border border-gray-200 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Uang Diterima dari Pelanggan (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={cashReceived || ''}
                    onChange={(e) => setCashReceived(Number(e.target.value))}
                    className="w-full px-3 py-2 text-lg font-bold border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>

                {/* Tombol Pecahan Uang Cepat */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setCashReceived(finalTotal)}
                    className="px-2.5 py-1 bg-white border border-gray-300 text-[11px] font-semibold rounded-lg hover:bg-gray-100"
                  >
                    Uang Pas
                  </button>
                  {[10000, 20000, 50000, 100000].map((nominal) => (
                    <button
                      key={nominal}
                      type="button"
                      onClick={() => setCashReceived(nominal)}
                      className="px-2.5 py-1 bg-white border border-gray-300 text-[11px] font-semibold rounded-lg hover:bg-gray-100"
                    >
                      {formatRupiah(nominal)}
                    </button>
                  ))}
                </div>

                {/* Kembalian */}
                <div className="pt-2 border-t border-gray-200 flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-600">Uang Kembalian:</span>
                  <span className={`text-base font-bold ${cashReceived >= finalTotal ? 'text-green-600' : 'text-rose-600'}`}>
                    {cashReceived >= finalTotal ? formatRupiah(changeAmount) : 'Kurang ' + formatRupiah(finalTotal - cashReceived)}
                  </span>
                </div>
              </div>
            )}

            {/* KONTEN METODE 2: QRIS STATIS TOKO */}
            {paymentMethod === 'QRIS' && (
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 mb-4 flex flex-col items-center text-center">
                <div className="text-xs font-bold text-gray-800 mb-2 flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-brand-600" />
                  Pindai QRIS {settings.storeName}
                </div>

                {settings.qrisImageUrl ? (
                  <div className="p-3 bg-white rounded-2xl shadow-sm border border-gray-200 max-w-xs">
                    <img
                      src={settings.qrisImageUrl}
                      alt="QRIS Toko"
                      className="max-h-52 object-contain mx-auto"
                    />
                    <p className="text-[11px] font-semibold text-gray-600 mt-2">
                      Scan dengan GoPay, OVO, Dana, BCA, atau ShopeePay
                    </p>
                  </div>
                ) : (
                  <div className="p-6 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-xs">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-amber-600" />
                    Foto QRIS statis belum diunggah. Silakan unggah foto QRIS toko Anda di menu <strong>Pengaturan</strong>.
                  </div>
                )}
              </div>
            )}

            {/* KONTEN METODE 3: TRANSFER BANK */}
            {paymentMethod === 'TRANSFER' && (
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 mb-4 space-y-3">
                <div className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  Rekening Penerimaan Transfer Toko
                </div>

                <div className="p-3 bg-white rounded-xl border border-gray-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase">{settings.bankName || 'BANK'}</span>
                    <div className="font-mono font-bold text-sm text-gray-900">{settings.bankAccountNo || 'Belum diatur'}</div>
                    <div className="text-xs text-gray-500">a.n. {settings.bankAccountHolder || '-'}</div>
                  </div>
                  {settings.bankAccountNo && (
                    <button
                      type="button"
                      onClick={handleCopyAccountNo}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      {copiedBank ? 'Tersalin!' : 'Salin No Rek'}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* KONTEN METODE 4: PIUTANG / KREDIT */}
            {paymentMethod === 'CREDIT' && (
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 mb-4 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-brand-600" />
                    Pilih Pelanggan Terdaftar *
                  </label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 bg-white"
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} (Limit: {formatRupiah(c.creditLimit)}, Sisa Utang: {formatRupiah(c.currentDebt)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Tanggal Jatuh Tempo Pembayaran
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>
            )}

            {/* Catatan Transaksi */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Catatan Tambahan (Opsional)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Catatan struk / meja..."
                className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none"
              />
            </div>

            {/* Tombol Konfirmasi Selesai */}
            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsCheckoutModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={processing}
                onClick={handleProcessCheckout}
                className="px-6 py-2.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50"
              >
                {processing ? 'Memproses...' : 'Selesaikan Transaksi & Cetak Struk'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL STRUK KASIR CETAK (THERMAL 58MM/80MM) */}
      {isReceiptModalOpen && completedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 animate-scale-in flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-2">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-900">Transaksi Berhasil!</h3>
            <p className="text-xs text-gray-500 mb-4">Nomor Faktur: {completedSale.invoiceNo}</p>

            {/* AREA STRUK THERMAL CETAK */}
            <div id="receipt-print-area" className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl font-mono text-xs text-gray-800 space-y-2 mb-4">
              <div className="text-center pb-2 border-b border-dashed border-gray-300">
                <div className="font-bold text-sm uppercase">{settings.storeName}</div>
                <div className="text-[10px] text-gray-500">{settings.storeAddress}</div>
                <div className="text-[10px] text-gray-500">Telp: {settings.storePhone}</div>
              </div>

              <div className="text-[11px] space-y-0.5 pb-2 border-b border-dashed border-gray-300">
                <div>No: {completedSale.invoiceNo}</div>
                <div>Tgl: {formatTanggal(completedSale.date)}</div>
                <div>Metode: {completedSale.paymentMethod}</div>
                <div>Pelanggan: {completedSale.customerName}</div>
              </div>

              {/* Items List */}
              <div className="space-y-1 pb-2 border-b border-dashed border-gray-300 text-[11px]">
                {completedSale.items.map((it: any, idx: number) => (
                  <div key={idx} className="flex justify-between">
                    <span>
                      {it.productName} × {it.quantity}
                    </span>
                    <span>{formatRupiah(it.sellingPrice * it.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1 text-[11px] pt-1">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatRupiah(completedSale.totalAmount)}</span>
                </div>
                {completedSale.discount > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Diskon:</span>
                    <span>-{formatRupiah(completedSale.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-xs pt-1 border-t border-gray-200">
                  <span>TOTAL:</span>
                  <span>{formatRupiah(completedSale.finalAmount)}</span>
                </div>
                {completedSale.paymentMethod === 'CASH' && (
                  <>
                    <div className="flex justify-between">
                      <span>Diterima:</span>
                      <span>{formatRupiah(completedSale.cashReceived)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Kembalian:</span>
                      <span>{formatRupiah(completedSale.changeAmount)}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="text-center pt-2 border-t border-dashed border-gray-300 text-[10px] text-gray-500">
                *** Terima Kasih Telah Berbelanja ***
              </div>
            </div>

            {/* Tombol Aksi Struk */}
            <div className="flex gap-2 w-full">
              <button
                type="button"
                onClick={handlePrintReceipt}
                className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-900 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md"
              >
                <Printer className="w-4 h-4" />
                Cetak Struk
              </button>
              <button
                type="button"
                onClick={() => setIsReceiptModalOpen(false)}
                className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-xs shadow-md"
              >
                Transaksi Baru
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
