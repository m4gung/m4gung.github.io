import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { SyncEngine } from '../services/syncEngine';
import { AuditAndSecurityService } from '../services/auditService';
import { Settings, Database, Cloud, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import type { ShopSettings } from '../types';

export const SettingsPage: React.FC = () => {
  const { showToast, reloadSettings } = useApp();
  const [settings, setSettings] = useState<ShopSettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isTestingUrl, setIsTestingUrl] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    async function load() {
      const data = await db.settings.get('default');
      if (data) setSettings(data);
    }
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setIsSaving(true);
    try {
      await db.settings.put({
        ...settings,
        updatedAt: new Date().toISOString()
      });
      await reloadSettings();
      showToast('Pengaturan berhasil disimpan!', 'success');
    } catch (err: any) {
      showToast('Gagal menyimpan: ' + err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestGoogleSheets = async () => {
    if (!settings?.googleAppsScriptUrl) {
      showToast('Masukkan URL Google Apps Script terlebih dahulu.', 'error');
      return;
    }

    setIsTestingUrl(true);
    setTestResult(null);
    try {
      const res = await SyncEngine.testGoogleSheetsConnection(settings.googleAppsScriptUrl);
      setTestResult(res);
      if (res.success) showToast(res.message, 'success');
      else showToast(res.message, 'error');
    } finally {
      setIsTestingUrl(false);
    }
  };

  if (!settings) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-neutral-100 flex items-center gap-2">
            <Settings className="w-5 h-5 text-amber-500" />
            Pengaturan Sistem Barbershop
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Kelola profil usaha, integrasi Google Spreadsheet / Spring Boot, komisi, dan uang makan.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Storage Mode Selection */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-amber-400 flex items-center gap-2">
            <Cloud className="w-4 h-4" />
            Pilihan Mode Penyimpanan Data (Cloud Storage)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label
              className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                settings.storageMode === 'GOOGLE_SHEETS'
                  ? 'bg-amber-500/10 border-amber-500/50 text-neutral-100'
                  : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:border-neutral-700'
              }`}
            >
              <input
                type="radio"
                name="storageMode"
                value="GOOGLE_SHEETS"
                checked={settings.storageMode === 'GOOGLE_SHEETS'}
                onChange={() => setSettings({ ...settings, storageMode: 'GOOGLE_SHEETS' })}
                className="mt-1 text-amber-500 focus:ring-amber-500"
              />
              <div>
                <p className="font-bold text-sm text-neutral-200">Google Spreadsheet (Serverless)</p>
                <p className="text-xs text-neutral-400 mt-1">
                  Gratis tanpa biaya server. Data transaksi langsung masuk ke file Google Sheets Anda via Google Apps Script.
                </p>
              </div>
            </label>

            <label
              className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                settings.storageMode === 'SPRING_BOOT'
                  ? 'bg-amber-500/10 border-amber-500/50 text-neutral-100'
                  : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:border-neutral-700'
              }`}
            >
              <input
                type="radio"
                name="storageMode"
                value="SPRING_BOOT"
                checked={settings.storageMode === 'SPRING_BOOT'}
                onChange={() => setSettings({ ...settings, storageMode: 'SPRING_BOOT' })}
                className="mt-1 text-amber-500 focus:ring-amber-500"
              />
              <div>
                <p className="font-bold text-sm text-neutral-200">Backend Spring Boot + PostgreSQL</p>
                <p className="text-xs text-neutral-400 mt-1">
                  Database relasional perusahaan untuk deployment lokal / server dedicated berkecepatan tinggi.
                </p>
              </div>
            </label>
          </div>

          {/* Google Apps Script Input */}
          {settings.storageMode === 'GOOGLE_SHEETS' && (
            <div className="pt-3 border-t border-neutral-800/80 space-y-3">
              <label className="block text-xs font-medium text-neutral-300">
                URL Google Apps Script Web App:
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://script.google.com/macros/s/.../exec"
                  value={settings.googleAppsScriptUrl}
                  onChange={e => setSettings({ ...settings, googleAppsScriptUrl: e.target.value })}
                  className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-sm text-neutral-100 placeholder-neutral-600 focus:border-amber-500 focus:outline-none"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  isLoading={isTestingUrl}
                  loadingText="Menguji..."
                  onClick={handleTestGoogleSheets}
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1" />
                  Uji Koneksi
                </Button>
              </div>

              {testResult && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    testResult.success
                      ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
                      : 'bg-rose-950/60 border border-rose-800 text-rose-300'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span>{testResult.message}</span>
                </div>
              )}
            </div>
          )}

          {/* Spring Boot Input */}
          {settings.storageMode === 'SPRING_BOOT' && (
            <div className="pt-3 border-t border-neutral-800/80 space-y-2">
              <label className="block text-xs font-medium text-neutral-300">
                URL Endpoint Spring Boot:
              </label>
              <input
                type="text"
                value={settings.springBootApiUrl}
                onChange={e => setSettings({ ...settings, springBootApiUrl: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-sm text-neutral-100 placeholder-neutral-600 focus:border-amber-500 focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* Profil Barbershop */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-amber-400 flex items-center gap-2">
            <Database className="w-4 h-4" />
            Informasi Barbershop & Format Struk
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Nama Usaha / Barbershop:</label>
              <input
                type="text"
                value={settings.shopName}
                onChange={e => setSettings({ ...settings, shopName: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-sm text-neutral-100 focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Nomor Telepon / WhatsApp Toko:</label>
              <input
                type="text"
                value={settings.phone}
                onChange={e => setSettings({ ...settings, phone: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-sm text-neutral-100 focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-neutral-400 mb-1">Alamat Outlet:</label>
            <input
              type="text"
              value={settings.address}
              onChange={e => setSettings({ ...settings, address: e.target.value })}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-sm text-neutral-100 focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs text-neutral-400 mb-1">Pesan Footer Struk (Thermal & WhatsApp):</label>
            <input
              type="text"
              value={settings.receiptFooter}
              onChange={e => setSettings({ ...settings, receiptFooter: e.target.value })}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-sm text-neutral-100 focus:border-amber-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Aturan Komisi & Uang Makan */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-amber-400">
            Aturan Komisi Default & Uang Makan Karyawan
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Skema Komisi Layanan Default:</label>
              <div className="flex gap-2">
                <select
                  value={settings.defaultCommissionType}
                  onChange={e => setSettings({ ...settings, defaultCommissionType: e.target.value as any })}
                  className="bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-100 focus:border-amber-500 focus:outline-none"
                >
                  <option value="PERCENTAGE">Persentase (%)</option>
                  <option value="FIXED">Nominal Tetap (Rp)</option>
                </select>
                <input
                  type="number"
                  min="0"
                  value={settings.defaultCommissionValue}
                  onChange={e => setSettings({ ...settings, defaultCommissionValue: Number(e.target.value) })}
                  className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-sm text-neutral-100 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-neutral-400 mb-1">Uang Makan Standar per Hari Hadir (Rp):</label>
              <input
                type="number"
                min="0"
                step="5000"
                value={settings.defaultDailyMealAllowance}
                onChange={e => setSettings({ ...settings, defaultDailyMealAllowance: Number(e.target.value) })}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-sm text-neutral-100 focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <label className="flex items-center gap-2.5 pt-2 text-xs text-neutral-300 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.autoMealAllowanceOnAttendance}
              onChange={e => setSettings({ ...settings, autoMealAllowanceOnAttendance: e.target.checked })}
              className="rounded text-amber-500 focus:ring-amber-500 bg-neutral-950 border-neutral-800"
            />
            <span>Otomatis tambahkan uang makan saat karyawan tercatat "Hadir" pada absensi harian.</span>
          </label>
        </div>

        {/* Cadangan & Pemulihan Data (Disaster Recovery) */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-amber-400 flex items-center gap-2">
            <Database className="w-4 h-4" />
            Cadangan & Pemulihan Data Lokal (Disaster Recovery Backup)
          </h3>
          <p className="text-xs text-neutral-400">
            Unduh seluruh database lokal (layanan, produk, stok, transaksi, absensi) ke file JSON mandiri untuk keamanan tambahan.
          </p>

          <div className="flex flex-wrap gap-3 pt-1">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={async () => {
                const jsonStr = await AuditAndSecurityService.exportFullDatabaseBackupJSON();
                const blob = new Blob([jsonStr], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `backup_barbershop_${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                showToast('File backup database lokal berhasil diunduh!', 'success');
              }}
            >
              Unduh Backup Database (.JSON)
            </Button>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" variant="gold" size="lg" isLoading={isSaving} loadingText="Menyimpan...">
            Simpan Perubahan
          </Button>
        </div>
      </form>
    </div>
  );
};
