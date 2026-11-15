import React from 'react';
import { formatRupiah, formatTanggal } from '../utils/format';
import type { Sale, StoreSettings } from '../types';

interface ThermalReceiptProps {
  sale: Sale & { customerDebtSnapshot?: number };
  settings: StoreSettings;
}

export const ThermalReceipt: React.FC<ThermalReceiptProps> = ({ sale, settings }) => {
  return (
    <div
      id="receipt-print-area"
      className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl font-mono text-xs text-gray-800 space-y-2"
    >
      <div className="text-center pb-2 border-b border-dashed border-gray-300">
        <div className="font-bold text-sm uppercase">{settings.storeName || 'TOKO UMKM'}</div>
        {settings.storeAddress && <div className="text-[10px] text-gray-500">{settings.storeAddress}</div>}
        {settings.storePhone && <div className="text-[10px] text-gray-500">Telp: {settings.storePhone}</div>}
      </div>

      <div className="text-[11px] space-y-0.5 pb-2 border-b border-dashed border-gray-300">
        <div>No       : {sale.invoiceNo}</div>
        <div>Tgl      : {formatTanggal(sale.date)}</div>
        <div>Kasir    : Kasir POS</div>
        <div>Pelanggan: {sale.customerName || 'Pelanggan Umum'}</div>
        <div>Metode   : {sale.paymentMethod === 'CREDIT' ? 'TEMPO (KREDIT)' : sale.paymentMethod}</div>
        {sale.paymentMethod === 'CREDIT' && (
          <>
            <div className="text-rose-600 font-bold">Status   : BELUM LUNAS (UTANG)</div>
            {sale.dueDate && <div>Jatuh Tempo: {formatTanggal(sale.dueDate)}</div>}
          </>
        )}
      </div>

      <div className="space-y-1 pb-2 border-b border-dashed border-gray-300 text-[11px]">
        {(sale.items || []).map((it, idx) => (
          <div key={idx} className="flex justify-between gap-2">
            <span>
              {it.productName} × {it.quantity}
            </span>
            <span className="whitespace-nowrap">{formatRupiah(it.sellingPrice * it.quantity)}</span>
          </div>
        ))}
      </div>

      <div className="space-y-1 text-[11px] pt-1">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>{formatRupiah(sale.totalAmount)}</span>
        </div>
        {sale.discount > 0 && (
          <div className="flex justify-between text-rose-600">
            <span>Diskon:</span>
            <span>-{formatRupiah(sale.discount)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-xs pt-1 border-t border-gray-200">
          <span>TOTAL:</span>
          <span>{formatRupiah(sale.finalAmount)}</span>
        </div>

        {sale.paymentMethod === 'CASH' && (
          <>
            <div className="flex justify-between">
              <span>Diterima:</span>
              <span>{formatRupiah(sale.cashReceived)}</span>
            </div>
            <div className="flex justify-between">
              <span>Kembalian:</span>
              <span>{formatRupiah(sale.changeAmount)}</span>
            </div>
          </>
        )}

        {sale.paymentMethod === 'CREDIT' && (
          <>
            <div className="flex justify-between text-rose-600 font-bold">
              <span>Tagihan Tempo:</span>
              <span>{formatRupiah(sale.finalAmount)}</span>
            </div>
            {sale.customerDebtSnapshot !== undefined && sale.customerDebtSnapshot > 0 && (
              <div className="flex justify-between text-rose-700 font-bold pt-1 border-t border-dashed border-gray-300">
                <span>Total Utang Pelanggan:</span>
                <span>{formatRupiah(sale.customerDebtSnapshot)}</span>
              </div>
            )}
          </>
        )}
      </div>

      <div className="text-center pt-2 border-t border-dashed border-gray-300 text-[10px] text-gray-500">
        *** Terima Kasih Telah Berbelanja ***
      </div>
    </div>
  );
};
