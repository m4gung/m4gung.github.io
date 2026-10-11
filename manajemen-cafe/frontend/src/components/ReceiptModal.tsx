import React, { useState } from 'react';
import { Printer, Download, Copy, Share2, Check, X, Phone } from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  formatReceiptText,
  generateReceiptPdf,
  getWhatsAppShareUrl,
  printDirectThermalReceipt,
  formatCurrency
} from '../utils/receiptFormatter';
import type { LocalOrder } from '../db/cafeDb';

interface ReceiptModalProps {
  order: LocalOrder;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ order, onClose }) => {
  const { cafeName, activeOutlet, printerConfig } = useApp();
  const [copied, setCopied] = useState(false);
  const [customerPhone, setCustomerPhone] = useState(order.customerPhone || '');
  const [printStatus, setPrintStatus] = useState<string | null>(null);

  const receiptPlainText = formatReceiptText(order, cafeName, activeOutlet);

  const handleCopyText = async () => {
    await navigator.clipboard.writeText(receiptPlainText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPdf = () => {
    generateReceiptPdf(order, cafeName, activeOutlet);
  };

  const handleShareWhatsApp = () => {
    if (!customerPhone) {
      alert('Masukkan nomor WhatsApp pelanggan terlebih dahulu.');
      return;
    }
    const url = getWhatsAppShareUrl(customerPhone, receiptPlainText);
    window.open(url, '_blank');
  };

  const handleDirectThermalPrint = async () => {
    try {
      setPrintStatus('Mencetak ke printer termal...');
      await printDirectThermalReceipt(order, cafeName, activeOutlet, printerConfig);
      setPrintStatus('Cetak berhasil!');
      setTimeout(() => setPrintStatus(null), 2500);
    } catch (err: any) {
      setPrintStatus(`Gagal: ${err.message || 'Printer tidak terhubung'}`);
      setTimeout(() => setPrintStatus(null), 4000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-stone-200">
        
        {/* Modal Header */}
        <div className="bg-stone-900 text-stone-100 px-5 py-4 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base">Struk Transaksi Selesai</h3>
            <p className="text-xs text-stone-400">No: {order.orderNumber}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Receipt Paper Preview Container */}
        <div className="p-5 bg-stone-50 border-b border-stone-200 max-h-80 overflow-y-auto">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-stone-200 text-xs font-mono leading-relaxed text-stone-800">
            <div className="text-center font-bold text-sm tracking-wide mb-1">{cafeName}</div>
            <div className="text-center text-[10px] text-stone-500">{activeOutlet?.name}</div>
            {activeOutlet?.address && <div className="text-center text-[10px] text-stone-500">{activeOutlet.address}</div>}
            
            <div className="border-b border-dashed border-stone-300 my-2"></div>
            
            <div className="flex justify-between">
              <span>Waktu:</span>
              <span>{new Date(order.createdAt).toLocaleTimeString('id-ID')}</span>
            </div>
            <div className="flex justify-between">
              <span>Tipe:</span>
              <span>{order.orderType === 'DINE_IN' ? `Dine-In (${order.tableName || '-'})` : 'Takeaway'}</span>
            </div>
            {order.customerName && (
              <div className="flex justify-between">
                <span>Pelanggan:</span>
                <span>{order.customerName}</span>
              </div>
            )}

            <div className="border-b border-dashed border-stone-300 my-2"></div>

            {/* Items */}
            <div className="space-y-1.5">
              {order.items.map((item, idx) => (
                <div key={idx}>
                  <div className="flex justify-between font-semibold">
                    <span>{item.quantity}x {item.productName} {item.variantName ? `(${item.variantName})` : ''}</span>
                    <span>{formatCurrency(item.subtotal)}</span>
                  </div>
                  {item.notes && <div className="text-[10px] text-stone-500 italic pl-3">Catatan: {item.notes}</div>}
                </div>
              ))}
            </div>

            <div className="border-b border-dashed border-stone-300 my-2"></div>

            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            {order.taxAmount > 0 && (
              <div className="flex justify-between text-stone-600">
                <span>Pajak ({activeOutlet?.taxPercentage}%)</span>
                <span>{formatCurrency(order.taxAmount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-stone-900 text-sm mt-1">
              <span>TOTAL</span>
              <span>{formatCurrency(order.totalAmount)}</span>
            </div>
            <div className="flex justify-between text-stone-600 mt-1">
              <span>Bayar ({order.paymentMethod})</span>
              <span>{formatCurrency(order.amountPaid)}</span>
            </div>
            <div className="flex justify-between text-stone-600">
              <span>Kembalian</span>
              <span>{formatCurrency(order.changeAmount)}</span>
            </div>

            <div className="text-center text-[10px] text-stone-400 mt-3 pt-2 border-t border-dashed border-stone-200">
              {activeOutlet?.receiptFooter || 'Terima kasih atas kunjungan Anda!'}
            </div>
          </div>
        </div>

        {/* WhatsApp Phone Input */}
        <div className="px-5 pt-3 pb-1">
          <label className="block text-xs font-medium text-stone-700 mb-1">
            Nomor WhatsApp Pelanggan (opsional):
          </label>
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="08xxxxxxxxxx"
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
            <button
              onClick={handleShareWhatsApp}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Kirim WA</span>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-5 pt-3 space-y-2">
          {printStatus && (
            <div className="text-xs text-center py-1 px-2 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 font-medium">
              {printStatus}
            </div>
          )}

          {/* Primary Action: Direct Thermal Print */}
          <button
            onClick={handleDirectThermalPrint}
            className="w-full bg-stone-900 hover:bg-stone-800 text-white font-semibold py-2.5 px-4 rounded-xl text-sm flex items-center justify-center space-x-2 shadow-md transition"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>
              Cetak ke Printer Termal ({printerConfig.type === 'BLUETOOTH' ? 'Bluetooth' : printerConfig.type === 'USB' ? 'USB' : 'Browser'})
            </span>
          </button>

          {/* Secondary Actions Grid */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleDownloadPdf}
              className="flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-xs font-medium transition"
            >
              <Download className="w-3.5 h-3.5 text-stone-500" />
              <span>Download PDF</span>
            </button>
            <button
              onClick={handleCopyText}
              className="flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-xs font-medium transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-stone-500" />}
              <span>{copied ? 'Tersalin!' : 'Salin Teks'}</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-full py-2 text-xs text-stone-500 hover:text-stone-700 transition"
          >
            Tutup & Buat Pesanan Baru
          </button>
        </div>

      </div>
    </div>
  );
};
