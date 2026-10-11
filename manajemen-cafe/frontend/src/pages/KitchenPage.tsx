import React, { useState, useEffect } from 'react';
import {
  Clock,
  Play,
  Check,
  UtensilsCrossed,
  ShoppingBag,
  RefreshCw,
  Bell,
  AlertTriangle
} from 'lucide-react';
import { db, type LocalOrder } from '../db/cafeDb';
import { useApp } from '../context/AppContext';

// Simple Web Audio API Synthesizer for Kitchen Bell
function playKitchenChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  } catch (err) {
    // Audio context may require initial user interaction
  }
}

export const KitchenPage: React.FC = () => {
  const { activeOutlet } = useApp();
  const [kitchenOrders, setKitchenOrders] = useState<LocalOrder[]>([]);
  const [filterType, setFilterType] = useState<'ALL' | 'DINE_IN' | 'TAKEAWAY'>('ALL');
  const [lastOrderCount, setLastOrderCount] = useState<number>(0);

  const loadKitchenOrders = async () => {
    // Fetch orders that are PAID, IN_PREPARATION, or READY
    const orders = await db.orders
      .where('status')
      .anyOf(['PAID', 'IN_PREPARATION', 'READY'])
      .toArray();

    // Sort: oldest orders first (FIFO)
    orders.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    // Trigger chime if there are new incoming PAID orders
    const paidCount = orders.filter((o) => o.status === 'PAID').length;
    if (paidCount > lastOrderCount && lastOrderCount !== 0) {
      playKitchenChime();
    }
    setLastOrderCount(paidCount);

    setKitchenOrders(orders);
  };

  useEffect(() => {
    loadKitchenOrders();
    const interval = setInterval(() => {
      loadKitchenOrders();
    }, 5000); // 5s live polling
    return () => clearInterval(interval);
  }, [activeOutlet, lastOrderCount]);

  const handleUpdateStatus = async (
    order: LocalOrder,
    nextStatus: 'IN_PREPARATION' | 'READY' | 'COMPLETED'
  ) => {
    if (order.id === undefined) return;

    await db.orders.update(order.id, { status: nextStatus });

    // If order completed and was Dine-In with table, free the table
    if (nextStatus === 'COMPLETED' && order.tableName) {
      const table = await db.diningTables.where('tableNumber').equals(order.tableName).first();
      if (table) {
        await db.diningTables.update(table.id, { status: 'AVAILABLE' });
      }
    }

    await loadKitchenOrders();
  };

  const getElapsedTimeMinutes = (createdAt: string): number => {
    const elapsedMs = Date.now() - new Date(createdAt).getTime();
    return Math.floor(elapsedMs / 60000);
  };

  const filteredOrders = kitchenOrders.filter((o) => {
    if (filterType === 'DINE_IN') return o.orderType === 'DINE_IN';
    if (filterType === 'TAKEAWAY') return o.orderType === 'TAKEAWAY';
    return true;
  });

  const queuePaid = filteredOrders.filter((o) => o.status === 'PAID');
  const queueInPrep = filteredOrders.filter((o) => o.status === 'IN_PREPARATION');
  const queueReady = filteredOrders.filter((o) => o.status === 'READY');

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 flex flex-col space-y-4">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-stone-900">Kitchen & Barista Display (KDS)</h2>
            <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
              {kitchenOrders.length} Pesanan Aktif
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Layar operasional pembuatan kopi & makanan cabang {activeOutlet?.name}.
          </p>
        </div>

        {/* Filter Pills & Manual Refresh */}
        <div className="flex items-center gap-2">
          <div className="flex bg-stone-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1.5 rounded-lg transition ${
                filterType === 'ALL' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500'
              }`}
            >
              Semua ({kitchenOrders.length})
            </button>
            <button
              onClick={() => setFilterType('DINE_IN')}
              className={`px-3 py-1.5 rounded-lg transition ${
                filterType === 'DINE_IN' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500'
              }`}
            >
              Dine-In
            </button>
            <button
              onClick={() => setFilterType('TAKEAWAY')}
              className={`px-3 py-1.5 rounded-lg transition ${
                filterType === 'TAKEAWAY' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500'
              }`}
            >
              Takeaway
            </button>
          </div>

          <button
            onClick={() => {
              loadKitchenOrders();
              playKitchenChime();
            }}
            className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition"
            title="Refresh Antrean & Tes Suara Bell"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3-Column Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 items-start">
        
        {/* COLUMN 1: ANTREAN BARU (PAID) */}
        <div className="bg-stone-200/60 rounded-2xl p-3 space-y-3 flex flex-col min-h-[600px]">
          <div className="flex items-center justify-between pb-1 px-1">
            <h3 className="font-bold text-xs uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
              <span>1. Antrean Baru ({queuePaid.length})</span>
            </h3>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto">
            {queuePaid.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-xs text-stone-400 font-medium">
                Tidak ada antrean baru
              </div>
            ) : (
              queuePaid.map((order) => {
                const elapsedMin = getElapsedTimeMinutes(order.createdAt);
                const isLate = elapsedMin >= 10;
                return (
                  <div
                    key={order.syncId}
                    className={`bg-white rounded-2xl p-4 shadow-sm border transition flex flex-col justify-between ${
                      isLate ? 'border-rose-400 ring-1 ring-rose-300' : 'border-stone-200'
                    }`}
                  >
                    <div>
                      {/* Card Header */}
                      <div className="flex items-start justify-between border-b pb-2">
                        <div>
                          <span className="font-black text-stone-900 text-base">{order.orderNumber}</span>
                          <div className="flex items-center gap-1.5 text-[11px] text-stone-500 mt-0.5">
                            {order.orderType === 'DINE_IN' ? (
                              <span className="font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                                <UtensilsCrossed className="w-3 h-3" />
                                {order.tableName || 'Meja'}
                              </span>
                            ) : (
                              <span className="font-bold text-sky-800 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200 flex items-center gap-1">
                                <ShoppingBag className="w-3 h-3" />
                                Takeaway
                              </span>
                            )}
                            {order.customerName && <span>• {order.customerName}</span>}
                          </div>
                        </div>

                        {/* Elapsed Timer */}
                        <div
                          className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            isLate ? 'bg-rose-100 text-rose-700' : 'bg-stone-100 text-stone-600'
                          }`}
                        >
                          {isLate ? <AlertTriangle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          <span>{elapsedMin} mnt lalu</span>
                        </div>
                      </div>

                      {/* Items List */}
                      <div className="py-3 space-y-2">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="space-y-0.5">
                            <div className="flex items-center justify-between text-xs font-bold text-stone-900">
                              <span>
                                {item.quantity}x {item.productName}
                              </span>
                            </div>

                            {item.modifiers && item.modifiers.length > 0 && (
                              <div className="text-[11px] font-semibold text-amber-700 pl-3">
                                {item.modifiers.map((m) => m.name).join(', ')}
                              </div>
                            )}

                            {item.notes && (
                              <div className="text-[11px] text-stone-500 italic pl-3">
                                ✎ {item.notes}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Button: Start Prep */}
                    <button
                      onClick={() => handleUpdateStatus(order, 'IN_PREPARATION')}
                      className="w-full mt-2 bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 px-3 rounded-xl text-xs shadow-sm transition flex items-center justify-center gap-1.5 active:scale-98"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Mulai Buat Pesanan</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* COLUMN 2: SEDANG DIBUAT (IN_PREPARATION) */}
        <div className="bg-sky-50 rounded-2xl p-3 space-y-3 flex flex-col min-h-[600px] border border-sky-100">
          <div className="flex items-center justify-between pb-1 px-1">
            <h3 className="font-bold text-xs uppercase tracking-wider text-sky-900 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse"></span>
              <span>2. Sedang Dibuat ({queueInPrep.length})</span>
            </h3>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto">
            {queueInPrep.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-xs text-sky-400 font-medium">
                Belum ada pesanan yang sedang diproses
              </div>
            ) : (
              queueInPrep.map((order) => {
                const elapsedMin = getElapsedTimeMinutes(order.createdAt);
                return (
                  <div
                    key={order.syncId}
                    className="bg-white rounded-2xl p-4 shadow-sm border border-sky-200 transition flex flex-col justify-between"
                  >
                    <div>
                      {/* Card Header */}
                      <div className="flex items-start justify-between border-b pb-2">
                        <div>
                          <span className="font-black text-stone-900 text-base">{order.orderNumber}</span>
                          <div className="flex items-center gap-1.5 text-[11px] text-stone-500 mt-0.5">
                            {order.orderType === 'DINE_IN' ? (
                              <span className="font-bold text-sky-800 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">
                                {order.tableName || 'Meja'}
                              </span>
                            ) : (
                              <span className="font-bold text-sky-800 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">
                                Takeaway
                              </span>
                            )}
                            {order.customerName && <span>• {order.customerName}</span>}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-700">
                          <Clock className="w-3 h-3" />
                          <span>{elapsedMin} mnt lalu</span>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="py-3 space-y-2">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="space-y-0.5">
                            <div className="flex items-center justify-between text-xs font-bold text-stone-900">
                              <span>
                                {item.quantity}x {item.productName}
                              </span>
                            </div>
                            {item.modifiers && item.modifiers.length > 0 && (
                              <div className="text-[11px] font-semibold text-amber-700 pl-3">
                                {item.modifiers.map((m) => m.name).join(', ')}
                              </div>
                            )}
                            {item.notes && (
                              <div className="text-[11px] text-stone-500 italic pl-3">
                                ✎ {item.notes}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Button: Mark Ready */}
                    <button
                      onClick={() => handleUpdateStatus(order, 'READY')}
                      className="w-full mt-2 bg-sky-600 hover:bg-sky-700 text-white font-bold py-2.5 px-3 rounded-xl text-xs shadow-sm transition flex items-center justify-center gap-1.5 active:scale-98"
                    >
                      <Bell className="w-3.5 h-3.5" />
                      <span>Selesai Dibuat (Siap Diambil)</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* COLUMN 3: SIAP DIAMBIL (READY) */}
        <div className="bg-emerald-50 rounded-2xl p-3 space-y-3 flex flex-col min-h-[600px] border border-emerald-100">
          <div className="flex items-center justify-between pb-1 px-1">
            <h3 className="font-bold text-xs uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>3. Siap Diambil / Saji ({queueReady.length})</span>
            </h3>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto">
            {queueReady.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-xs text-emerald-400 font-medium">
                Belum ada pesanan yang siap diambil
              </div>
            ) : (
              queueReady.map((order) => (
                <div
                  key={order.syncId}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-emerald-200 transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between border-b pb-2">
                      <div>
                        <span className="font-black text-stone-900 text-base">{order.orderNumber}</span>
                        <div className="text-[11px] font-bold text-emerald-800 mt-0.5">
                          {order.orderType === 'DINE_IN' ? `Dine-In (${order.tableName || '-'})` : 'Takeaway'}
                          {order.customerName && ` • ${order.customerName}`}
                        </div>
                      </div>

                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        Siap
                      </span>
                    </div>

                    <div className="py-2.5 space-y-1">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="text-xs font-semibold text-stone-700">
                          {item.quantity}x {item.productName}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Button: Complete Order */}
                  <button
                    onClick={() => handleUpdateStatus(order, 'COMPLETED')}
                    className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-3 rounded-xl text-xs shadow-sm transition flex items-center justify-center gap-1.5 active:scale-98"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Serahkan & Selesaikan Pesanan</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
