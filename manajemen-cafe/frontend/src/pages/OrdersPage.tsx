import React, { useState, useEffect } from 'react';
import { Clock, Receipt, RefreshCw, CheckCircle, Clock3 } from 'lucide-react';
import { db, type LocalOrder } from '../db/cafeDb';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/receiptFormatter';
import { ReceiptModal } from '../components/ReceiptModal';

export const OrdersPage: React.FC = () => {
  const { activeOutlet, triggerSync, syncStatus } = useApp();
  const [orders, setOrders] = useState<LocalOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<LocalOrder | null>(null);

  const loadOrders = async () => {
    const list = await db.orders.orderBy('createdAt').reverse().toArray();
    setOrders(list);
  };

  useEffect(() => {
    loadOrders();
  }, [activeOutlet]);

  return (
    <div className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-stone-900">Riwayat Pesanan & Transaksi</h2>
          <p className="text-xs text-stone-500">
            Daftar transaksi tersimpan di memori lokal (IndexedDB) & antrean sinkronisasi server.
          </p>
        </div>

        <button
          onClick={async () => {
            await triggerSync();
            await loadOrders();
          }}
          disabled={syncStatus === 'SYNCING'}
          className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 flex items-center gap-1.5 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${syncStatus === 'SYNCING' ? 'animate-spin' : ''}`} />
          <span>Refresh & Sync</span>
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-stone-200 text-center space-y-3">
          <Clock className="w-12 h-12 text-stone-300 mx-auto" />
          <h4 className="font-semibold text-stone-700 text-sm">Belum ada transaksi hari ini</h4>
          <p className="text-xs text-stone-400">Silakan lakukan transaksi pertama di menu Kasir POS.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
          <div className="divide-y divide-stone-100">
            {orders.map((ord) => (
              <div
                key={ord.syncId}
                onClick={() => setSelectedOrder(ord)}
                className="p-4 hover:bg-stone-50/80 transition cursor-pointer flex items-center justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-stone-900 text-sm">{ord.orderNumber}</span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-stone-100 text-stone-700">
                      {ord.orderType === 'DINE_IN' ? `Dine-In (${ord.tableName || '-'})` : 'Takeaway'}
                    </span>
                    {ord.isSynced ? (
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Synced
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                        <Clock3 className="w-3 h-3" /> Lokal / Pending
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-stone-500">
                    {new Date(ord.createdAt).toLocaleString('id-ID')} • {ord.items.length} item •{' '}
                    <span className="font-medium text-stone-700">{ord.paymentMethod}</span>
                  </p>
                </div>

                <div className="text-right flex items-center gap-3">
                  <span className="font-bold text-stone-900 text-sm">
                    {formatCurrency(ord.totalAmount)}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedOrder(ord);
                    }}
                    className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition"
                    title="Buka Struk (Cetak / PDF / WA)"
                  >
                    <Receipt className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedOrder && (
        <ReceiptModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
    </div>
  );
};
