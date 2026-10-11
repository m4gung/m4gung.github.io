import React, { useState, useEffect } from 'react';
import {
  Store,
  Printer,
  Cloud,
  CheckCircle,
  Plus,
  RefreshCw,
  ExternalLink,
  Shield,
  Search
} from 'lucide-react';
import { db, type LocalAuditLog } from '../db/cafeDb';
import { useApp } from '../context/AppContext';
import { bluetoothPrinter } from '../printing/bluetoothPrinter';
import { serialPrinter } from '../printing/serialPrinter';
import { EscposBuilder } from '../printing/escposBuilder';
import type { BackendMode } from '../api/syncManager';

export const SettingsPage: React.FC = () => {
  const {
    cafeName,
    setCafeName,
    outlets,
    activeOutlet,
    setActiveOutletId,
    addOutlet,
    backendMode,
    gasUrl,
    updateBackendSettings,
    printerConfig,
    updatePrinterConfig,
    triggerSync,
    pendingSyncCount
  } = useApp();

  // Local form states
  const [nameInput, setNameInput] = useState(cafeName);
  const [selectedBackend, setSelectedBackend] = useState<BackendMode>(backendMode);
  const [gasUrlInput, setGasUrlInput] = useState(gasUrl);
  
  // New Outlet Form
  const [newOutletName, setNewOutletName] = useState('');
  const [newOutletAddress, setNewOutletAddress] = useState('');
  const [newOutletPhone, setNewOutletPhone] = useState('');
  const [showAddOutlet, setShowAddOutlet] = useState(false);

  // Printer status
  const [printerStatusMessage, setPrinterStatusMessage] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Audit Logs state
  const [auditLogs, setAuditLogs] = useState<LocalAuditLog[]>([]);
  const [auditSearch, setAuditSearch] = useState('');
  const [auditFilter, setAuditFilter] = useState('ALL');

  const loadAuditLogs = async () => {
    try {
      const logs = await db.auditLogs.orderBy('id').reverse().limit(100).toArray();
      setAuditLogs(logs);
    } catch (e) {
      console.error('Failed to load audit logs:', e);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    await setCafeName(nameInput);
    await updateBackendSettings(selectedBackend, gasUrlInput);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleCreateOutlet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOutletName.trim()) return;
    await addOutlet(newOutletName, newOutletAddress, newOutletPhone);
    setNewOutletName('');
    setNewOutletAddress('');
    setNewOutletPhone('');
    setShowAddOutlet(false);
  };

  const handleConnectPrinter = async () => {
    try {
      setPrinterStatusMessage('Menghubungkan ke printer...');
      if (printerConfig.type === 'BLUETOOTH') {
        const name = await bluetoothPrinter.connect();
        await updatePrinterConfig({ ...printerConfig, deviceName: name });
        setPrinterStatusMessage(`Terhubung ke Bluetooth: ${name}`);
      } else if (printerConfig.type === 'USB') {
        const name = await serialPrinter.connect();
        await updatePrinterConfig({ ...printerConfig, deviceName: name });
        setPrinterStatusMessage(`Terhubung ke USB Serial: ${name}`);
      } else {
        setPrinterStatusMessage('Mode Browser Print aktif (menggunakan dialog print standar)');
      }
    } catch (err: any) {
      setPrinterStatusMessage(`Koneksi gagal: ${err.message}`);
    }
  };

  const handleTestPrint = async () => {
    try {
      setPrinterStatusMessage('Mengirim tes cetak...');
      const builder = new EscposBuilder(printerConfig.paperWidth);
      builder.align('center')
        .bold(true)
        .line(`=== ${cafeName.toUpperCase()} ===`)
        .line('TEST PRINT THERMAL')
        .bold(false)
        .divider()
        .line(`Lebar: ${printerConfig.paperWidth}mm`)
        .line(`Mode: ${printerConfig.type}`)
        .line(`Waktu: ${new Date().toLocaleTimeString('id-ID')}`)
        .divider()
        .line('Printer Berfungsi Normal!')
        .feed(3);

      if (printerConfig.autoCut) {
        builder.cut();
      }

      const bytes = builder.build();

      if (printerConfig.type === 'BLUETOOTH') {
        await bluetoothPrinter.print(bytes);
      } else if (printerConfig.type === 'USB') {
        await serialPrinter.print(bytes);
      } else {
        window.print();
      }

      setPrinterStatusMessage('Tes cetak berhasil terkirim!');
    } catch (err: any) {
      setPrinterStatusMessage(`Tes cetak gagal: ${err.message}`);
    }
  };

  return (
    <div className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-6">
      
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-stone-900">Pengaturan Sistem</h2>
          <p className="text-xs text-stone-500">Kelola identitas kafe, multi-outlet, sinkronisasi backend, dan printer termal.</p>
        </div>
        {savedSuccess && (
          <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
            <CheckCircle className="w-4 h-4" />
            <span>Pengaturan Disimpan</span>
          </span>
        )}
      </div>

      <form onSubmit={handleSaveGeneral} className="space-y-6">
        
        {/* 1. KAFE & IDENTITAS */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-200 space-y-4">
          <div className="flex items-center gap-2 border-b pb-3">
            <Store className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-sm text-stone-900">Identitas Café & Outlet</h3>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Nama Brand Café:
            </label>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="w-full text-sm p-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
              placeholder="Contoh: Kopi Senja, CafeFlow"
            />
          </div>

          {/* Multi-Outlet Management */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-stone-700">Daftar Cabang / Outlet:</label>
              <button
                type="button"
                onClick={() => setShowAddOutlet(!showAddOutlet)}
                className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Cabang</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {outlets.map((o) => (
                <div
                  key={o.id}
                  onClick={() => setActiveOutletId(o.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                    o.id === activeOutlet?.id
                      ? 'border-amber-600 bg-amber-50/70 ring-1 ring-amber-600'
                      : 'border-stone-200 hover:border-stone-300 bg-stone-50'
                  }`}
                >
                  <div>
                    <h5 className="font-semibold text-xs text-stone-900">{o.name}</h5>
                    <p className="text-[11px] text-stone-500">{o.address || 'Alamat belum diatur'}</p>
                  </div>
                  {o.id === activeOutlet?.id && (
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-200/70 px-2 py-0.5 rounded-full">
                      Aktif
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Add Outlet Form */}
            {showAddOutlet && (
              <div className="mt-3 p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
                <h5 className="text-xs font-bold text-stone-800">Tambah Cabang Baru</h5>
                <input
                  type="text"
                  placeholder="Nama Cabang (cth: Cabang Kemang)"
                  value={newOutletName}
                  onChange={(e) => setNewOutletName(e.target.value)}
                  className="w-full text-xs p-2 border border-stone-300 rounded-lg focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Alamat Cabang"
                  value={newOutletAddress}
                  onChange={(e) => setNewOutletAddress(e.target.value)}
                  className="w-full text-xs p-2 border border-stone-300 rounded-lg focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="No. Telepon"
                  value={newOutletPhone}
                  onChange={(e) => setNewOutletPhone(e.target.value)}
                  className="w-full text-xs p-2 border border-stone-300 rounded-lg focus:outline-none"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddOutlet(false)}
                    className="px-3 py-1 text-xs text-stone-600 hover:bg-stone-200 rounded-lg"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateOutlet}
                    className="px-3 py-1 text-xs bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700"
                  >
                    Simpan Cabang
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 2. SINKRONISASI BACKEND & GOOGLE APPS SCRIPT */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-200 space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2">
              <Cloud className="w-5 h-5 text-sky-600" />
              <div>
                <h3 className="font-bold text-sm text-stone-900">Sinkronisasi & Pilihan Backend</h3>
                <p className="text-[11px] text-stone-500">Pilih target server sinkronisasi transaksi offline.</p>
              </div>
            </div>
            {pendingSyncCount > 0 && (
              <button
                type="button"
                onClick={() => triggerSync()}
                className="text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Sync {pendingSyncCount} Data</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label
              className={`p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                selectedBackend === 'SPRING_BOOT'
                  ? 'border-sky-600 bg-sky-50/70 ring-1 ring-sky-600'
                  : 'border-stone-200 hover:bg-stone-50'
              }`}
            >
              <div className="flex items-start justify-between">
                <input
                  type="radio"
                  name="backendMode"
                  value="SPRING_BOOT"
                  checked={selectedBackend === 'SPRING_BOOT'}
                  onChange={() => setSelectedBackend('SPRING_BOOT')}
                  className="text-sky-600 focus:ring-0"
                />
                <span className="text-[10px] font-bold text-sky-800 bg-sky-100 px-2 py-0.5 rounded">Server</span>
              </div>
              <div className="mt-2">
                <h5 className="font-bold text-xs text-stone-900">Spring Boot Backend</h5>
                <p className="text-[11px] text-stone-500 mt-0.5">REST API PostgreSQL enterprise.</p>
              </div>
            </label>

            <label
              className={`p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                selectedBackend === 'APPS_SCRIPT'
                  ? 'border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-600'
                  : 'border-stone-200 hover:bg-stone-50'
              }`}
            >
              <div className="flex items-start justify-between">
                <input
                  type="radio"
                  name="backendMode"
                  value="APPS_SCRIPT"
                  checked={selectedBackend === 'APPS_SCRIPT'}
                  onChange={() => setSelectedBackend('APPS_SCRIPT')}
                  className="text-emerald-600 focus:ring-0"
                />
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">Gratis</span>
              </div>
              <div className="mt-2">
                <h5 className="font-bold text-xs text-stone-900">Google Apps Script</h5>
                <p className="text-[11px] text-stone-500 mt-0.5">Simpan ke Google Sheets tanpa biaya server.</p>
              </div>
            </label>

            <label
              className={`p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                selectedBackend === 'DUAL'
                  ? 'border-purple-600 bg-purple-50/70 ring-1 ring-purple-600'
                  : 'border-stone-200 hover:bg-stone-50'
              }`}
            >
              <div className="flex items-start justify-between">
                <input
                  type="radio"
                  name="backendMode"
                  value="DUAL"
                  checked={selectedBackend === 'DUAL'}
                  onChange={() => setSelectedBackend('DUAL')}
                  className="text-purple-600 focus:ring-0"
                />
                <span className="text-[10px] font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded">Dual</span>
              </div>
              <div className="mt-2">
                <h5 className="font-bold text-xs text-stone-900">Keduanya (Dual Mode)</h5>
                <p className="text-[11px] text-stone-500 mt-0.5">Sync ke Spring Boot + backup ke Google Sheets.</p>
              </div>
            </label>
          </div>

          {(selectedBackend === 'APPS_SCRIPT' || selectedBackend === 'DUAL') && (
            <div className="space-y-1.5 pt-2 border-t">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-stone-700">URL Web App Google Apps Script:</label>
                <a
                  href="/apps-script/README.md"
                  target="_blank"
                  className="text-[11px] text-emerald-600 hover:underline flex items-center gap-1"
                >
                  <span>Cara Pasang</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <input
                type="url"
                value={gasUrlInput}
                onChange={(e) => setGasUrlInput(e.target.value)}
                placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                className="w-full text-xs font-mono p-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* 3. PENGATURAN PRINTER TERMAL */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-200 space-y-4">
          <div className="flex items-center gap-2 border-b pb-3">
            <Printer className="w-5 h-5 text-stone-800" />
            <div>
              <h3 className="font-bold text-sm text-stone-900">Pengaturan Printer Termal Kasir</h3>
              <p className="text-[11px] text-stone-500">Koneksi langsung printer ESC/POS via Web Bluetooth atau USB.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label
              className={`p-3 rounded-xl border cursor-pointer transition ${
                printerConfig.type === 'BLUETOOTH'
                  ? 'border-amber-600 bg-amber-50/70 ring-1 ring-amber-600'
                  : 'border-stone-200 hover:bg-stone-50'
              }`}
            >
              <input
                type="radio"
                name="printerType"
                checked={printerConfig.type === 'BLUETOOTH'}
                onChange={() => updatePrinterConfig({ ...printerConfig, type: 'BLUETOOTH' })}
                className="text-amber-600"
              />
              <span className="ml-2 font-bold text-xs text-stone-900">Web Bluetooth</span>
              <p className="text-[11px] text-stone-500 mt-1">Untuk HP/Tablet kasir nirkabel (Chrome).</p>
            </label>

            <label
              className={`p-3 rounded-xl border cursor-pointer transition ${
                printerConfig.type === 'USB'
                  ? 'border-amber-600 bg-amber-50/70 ring-1 ring-amber-600'
                  : 'border-stone-200 hover:bg-stone-50'
              }`}
            >
              <input
                type="radio"
                name="printerType"
                checked={printerConfig.type === 'USB'}
                onChange={() => updatePrinterConfig({ ...printerConfig, type: 'USB' })}
                className="text-amber-600"
              />
              <span className="ml-2 font-bold text-xs text-stone-900">Web USB / Serial</span>
              <p className="text-[11px] text-stone-500 mt-1">Kabel USB langsung ke laptop/PC kasir.</p>
            </label>

            <label
              className={`p-3 rounded-xl border cursor-pointer transition ${
                printerConfig.type === 'BROWSER'
                  ? 'border-amber-600 bg-amber-50/70 ring-1 ring-amber-600'
                  : 'border-stone-200 hover:bg-stone-50'
              }`}
            >
              <input
                type="radio"
                name="printerType"
                checked={printerConfig.type === 'BROWSER'}
                onChange={() => updatePrinterConfig({ ...printerConfig, type: 'BROWSER' })}
                className="text-amber-600"
              />
              <span className="ml-2 font-bold text-xs text-stone-900">Browser Print</span>
              <p className="text-[11px] text-stone-500 mt-1">Dialog standar cetak atau Chrome Kiosk.</p>
            </label>
          </div>

          {/* Width & AutoCut */}
          <div className="flex flex-wrap items-center gap-6 pt-2">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-stone-700">Lebar Kertas:</span>
              <select
                aria-label="Pilih Lebar Kertas"
                value={printerConfig.paperWidth}
                onChange={(e) =>
                  updatePrinterConfig({
                    ...printerConfig,
                    paperWidth: Number(e.target.value) as 58 | 80
                  })
                }
                className="text-xs py-1.5 px-3 border border-stone-300 rounded-lg focus:outline-none"
              >
                <option value={58}>58 mm (32 Kolom)</option>
                <option value={80}>80 mm (48 Kolom)</option>
              </select>
            </div>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={printerConfig.autoCut}
                onChange={(e) => updatePrinterConfig({ ...printerConfig, autoCut: e.target.checked })}
                className="rounded text-amber-600 focus:ring-0"
              />
              <span className="text-xs text-stone-700 font-medium">Potong Kertas Otomatis (Auto-Cut)</span>
            </label>
          </div>

          {printerStatusMessage && (
            <div className="text-xs py-1.5 px-3 bg-stone-100 rounded-lg text-stone-700 font-mono">
              {printerStatusMessage}
            </div>
          )}

          {/* Printer Actions */}
          <div className="flex gap-2 pt-2">
            {(printerConfig.type === 'BLUETOOTH' || printerConfig.type === 'USB') && (
              <button
                type="button"
                onClick={handleConnectPrinter}
                className="py-2 px-4 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-800 text-xs font-semibold transition"
              >
                Sambungkan Printer
              </button>
            )}
            <button
              type="button"
              onClick={handleTestPrint}
              className="py-2 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-sm"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>Uji Cetak (Test Print)</span>
            </button>
          </div>
        </div>

        {/* Save Button */}
        <button
          type="submit"
          className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-4 rounded-2xl text-sm shadow-md transition"
        >
          Simpan Semua Pengaturan
        </button>
      </form>

      {/* Security & Audit Trail Section */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-50 text-rose-700 rounded-xl">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900">Jejak Audit & Aktivitas Keamanan (Audit Trail)</h2>
              <p className="text-xs text-stone-500">Log perubahan krusial, penyesuaian stok, dan pembatalan transaksi</p>
            </div>
          </div>
          <button
            type="button"
            onClick={loadAuditLogs}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold self-start sm:self-auto transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Segarkan Log</span>
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
            <input
              type="text"
              placeholder="Cari user, aksi, rincian aktivitas..."
              value={auditSearch}
              onChange={(e) => setAuditSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-stone-300 rounded-xl focus:ring-amber-500 focus:border-amber-500"
            />
          </div>
          <select
            value={auditFilter}
            onChange={(e) => setAuditFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-stone-300 rounded-xl bg-white focus:ring-amber-500 focus:border-amber-500 font-medium text-stone-700"
          >
            <option value="ALL">Semua Aksi</option>
            <option value="ORDER_VOID">Pembatalan (VOID)</option>
            <option value="STOCK_ADJUST">Penyesuaian Stok</option>
            <option value="PRICE_UPDATE">Perubahan Harga</option>
            <option value="SYSTEM_INIT">Sistem</option>
          </select>
        </div>

        {/* Audit Logs Table */}
        <div className="border border-stone-200 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-semibold sticky top-0">
              <tr>
                <th className="py-2.5 px-3">Waktu</th>
                <th className="py-2.5 px-3">User</th>
                <th className="py-2.5 px-3">Aksi</th>
                <th className="py-2.5 px-3">Entitas</th>
                <th className="py-2.5 px-3">Keterangan Aktivitas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {auditLogs
                .filter((log) => {
                  if (auditFilter !== 'ALL' && log.action !== auditFilter) return false;
                  if (!auditSearch.trim()) return true;
                  const term = auditSearch.toLowerCase();
                  return (
                    log.username.toLowerCase().includes(term) ||
                    log.action.toLowerCase().includes(term) ||
                    log.details.toLowerCase().includes(term) ||
                    (log.entityId && log.entityId.toLowerCase().includes(term))
                  );
                })
                .map((log) => (
                  <tr key={log.id} className="hover:bg-stone-50/80 transition">
                    <td className="py-2 px-3 text-stone-500 whitespace-nowrap font-mono text-[11px]">
                      {new Date(log.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="py-2 px-3 font-medium text-stone-800 whitespace-nowrap">
                      {log.username}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          log.action.includes('VOID')
                            ? 'bg-rose-100 text-rose-700'
                            : log.action.includes('PRICE')
                            ? 'bg-amber-100 text-amber-800'
                            : log.action.includes('STOCK')
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-stone-100 text-stone-700'
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-stone-600 whitespace-nowrap font-mono text-[11px]">
                      {log.entityType} {log.entityId ? `(#${log.entityId})` : ''}
                    </td>
                    <td className="py-2 px-3 text-stone-700">
                      {log.details}
                    </td>
                  </tr>
                ))}
              {auditLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-stone-400">
                    Belum ada riwayat aktivitas yang tercatat.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
