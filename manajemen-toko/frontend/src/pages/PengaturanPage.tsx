import React, { useState } from 'react';
import { 
  Save, 
  Store, 
  CreditCard, 
  QrCode, 
  Database, 
  FileSpreadsheet, 
  Server, 
  CheckCircle2, 
  AlertCircle, 
  Upload, 
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import type { StoreSettings } from '../types';

export const PengaturanPage: React.FC = () => {
  const { settings, updateSettings, switchDataSourceMode, testConnection } = useStore();
  const [formData, setFormData] = useState<StoreSettings>({ ...settings });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [testingConn, setTestingConn] = useState(false);
  const [connResult, setConnResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleQrisImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Ukuran gambar maksimal 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, qrisImageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await updateSettings(formData);
      if (formData.dataSourceMode !== settings.dataSourceMode) {
        await switchDataSourceMode(
          formData.dataSourceMode, 
          formData.dataSourceMode === 'google_sheets' ? formData.googleSheetsUrl : formData.springBootApiUrl
        );
      }
      setMessage({ type: 'success', text: 'Pengaturan toko berhasil disimpan!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: `Gagal menyimpan: ${err.message}` });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTestingConn(true);
    setConnResult(null);
    try {
      // Jika mode di form berbeda, update sebentar atau panggil ping
      const res = await testConnection();
      setConnResult(res);
    } catch (err: any) {
      setConnResult({ success: false, message: err.message });
    } finally {
      setTestingConn(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 sm:px-6 lg:px-8 pb-24 md:pb-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Pengaturan Toko & Integrasi</h2>
          <p className="text-sm text-gray-600">
            Kelola identitas toko, nomor rekening penerimaan, QRIS statis, dan mode database.
          </p>
        </div>
      </div>

      {message && (
        <div
          className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          )}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* SECTION 1: SUMBER DATA & ARSITEKTUR GANDA */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
            <div className="p-2 bg-brand-50 text-brand-600 rounded-lg">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Mode Penyimpanan Database (Dual-Engine)</h3>
              <p className="text-xs text-gray-500">
                Pilih apakah data toko disimpan ke Google Sheets langsung, Backend Java, atau offline di perangkat.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Opsi 1: IndexedDB */}
            <label
              className={`relative flex flex-col p-4 border rounded-xl cursor-pointer transition-all ${
                formData.dataSourceMode === 'indexeddb'
                  ? 'border-brand-500 bg-brand-50/40 ring-2 ring-brand-500/20'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <input
                type="radio"
                name="dataSourceMode"
                value="indexeddb"
                checked={formData.dataSourceMode === 'indexeddb'}
                onChange={() => setFormData((prev) => ({ ...prev, dataSourceMode: 'indexeddb' }))}
                className="sr-only"
              />
              <div className="flex items-center gap-2 mb-2 text-amber-600 font-bold text-sm">
                <Database className="w-4 h-4" />
                IndexedDB (Lokal)
              </div>
              <p className="text-xs text-gray-600 flex-1">
                Data disimpan di browser perangkat. Bekerja 100% offline tanpa koneksi internet atau server luar.
              </p>
              <span className="mt-3 text-[11px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded w-fit">
                Siap Pakai
              </span>
            </label>

            {/* Opsi 2: Google Sheets Direct */}
            <label
              className={`relative flex flex-col p-4 border rounded-xl cursor-pointer transition-all ${
                formData.dataSourceMode === 'google_sheets'
                  ? 'border-brand-500 bg-brand-50/40 ring-2 ring-brand-500/20'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <input
                type="radio"
                name="dataSourceMode"
                value="google_sheets"
                checked={formData.dataSourceMode === 'google_sheets'}
                onChange={() => setFormData((prev) => ({ ...prev, dataSourceMode: 'google_sheets' }))}
                className="sr-only"
              />
              <div className="flex items-center gap-2 mb-2 text-emerald-600 font-bold text-sm">
                <FileSpreadsheet className="w-4 h-4" />
                Google Sheets Web App
              </div>
              <p className="text-xs text-gray-600 flex-1">
                Langsung tersimpan ke spreadsheet Google Sheets via Apps Script. Bebas biaya hosting server.
              </p>
              <span className="mt-3 text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded w-fit">
                Direkomendasikan UMKM
              </span>
            </label>

            {/* Opsi 3: Backend Java */}
            <label
              className={`relative flex flex-col p-4 border rounded-xl cursor-pointer transition-all ${
                formData.dataSourceMode === 'spring_boot'
                  ? 'border-brand-500 bg-brand-50/40 ring-2 ring-brand-500/20'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <input
                type="radio"
                name="dataSourceMode"
                value="spring_boot"
                checked={formData.dataSourceMode === 'spring_boot'}
                onChange={() => setFormData((prev) => ({ ...prev, dataSourceMode: 'spring_boot' }))}
                className="sr-only"
              />
              <div className="flex items-center gap-2 mb-2 text-blue-600 font-bold text-sm">
                <Server className="w-4 h-4" />
                Backend Spring Boot
              </div>
              <p className="text-xs text-gray-600 flex-1">
                REST API Spring Boot 3 + PostgreSQL. Menjamin transaksi konkuren ACID dan enterprise multi-kasir.
              </p>
              <span className="mt-3 text-[11px] font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded w-fit">
                Performa Tinggi
              </span>
            </label>
          </div>

          {/* Konfigurasi URL Spesifik Sesuai Mode */}
          {formData.dataSourceMode === 'google_sheets' && (
            <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 mb-4 space-y-3">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-semibold text-emerald-900">
                  URL Web App Google Apps Script
                </label>
                <a
                  href="https://script.google.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-emerald-700 hover:underline flex items-center gap-1 font-medium"
                >
                  Buka Apps Script <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <input
                type="url"
                name="googleSheetsUrl"
                value={formData.googleSheetsUrl}
                onChange={handleInputChange}
                placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                className="w-full px-3 py-2 text-sm bg-white border border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-xs text-emerald-700 leading-relaxed">
                Panduan: Salin kode dari file <code>google-apps-script/Code.gs</code> ke Apps Script di Spreadsheet Anda, lalu terapkan sebagai Web App (Akses: Anyone).
              </p>
            </div>
          )}

          {formData.dataSourceMode === 'spring_boot' && (
            <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200 mb-4 space-y-3">
              <label className="block text-sm font-semibold text-blue-900">
                Base URL REST API Spring Boot
              </label>
              <input
                type="url"
                name="springBootApiUrl"
                value={formData.springBootApiUrl}
                onChange={handleInputChange}
                placeholder="http://localhost:8080"
                className="w-full px-3 py-2 text-sm bg-white border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-blue-700">
                Pastikan backend Spring Boot telah dijalankan di port 8080 dengan database PostgreSQL aktif.
              </p>
            </div>
          )}

          {/* Tombol Uji Koneksi */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testingConn}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-300 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testingConn ? 'animate-spin' : ''}`} />
              {testingConn ? 'Menguji...' : 'Uji Koneksi Penyimpanan'}
            </button>
            {connResult && (
              <span
                className={`text-xs font-medium flex items-center gap-1 ${
                  connResult.success ? 'text-green-700' : 'text-red-600'
                }`}
              >
                {connResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600" />
                )}
                {connResult.message}
              </span>
            )}
          </div>
        </div>

        {/* SECTION 2: PROFIL TOKO */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
            <div className="p-2 bg-brand-50 text-brand-600 rounded-lg">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Profil & Identitas Toko</h3>
              <p className="text-xs text-gray-500">Informasi ini dicetak pada struk kasir dan faktur penjualan.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Nama Toko</label>
              <input
                type="text"
                name="storeName"
                value={formData.storeName}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Nomor Telepon / WhatsApp</label>
              <input
                type="tel"
                name="storePhone"
                value={formData.storePhone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Alamat Lengkap Toko</label>
              <textarea
                name="storeAddress"
                rows={2}
                value={formData.storeAddress}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: REKENING BANK & METODE PEMBAYARAN */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
            <div className="p-2 bg-brand-50 text-brand-600 rounded-lg">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Rekening Bank untuk Pembayaran Transfer</h3>
              <p className="text-xs text-gray-500">
                Ditampilkan pada kasir saat pembeli memilih metode pembayaran Transfer Bank.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Nama Bank</label>
              <input
                type="text"
                name="bankName"
                value={formData.bankName}
                onChange={handleInputChange}
                placeholder="Contoh: BCA / Mandiri / BRI / BSI"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Nomor Rekening</label>
              <input
                type="text"
                name="bankAccountNo"
                value={formData.bankAccountNo}
                onChange={handleInputChange}
                placeholder="Nomor rekening toko"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Nama Pemilik Rekening</label>
              <input
                type="text"
                name="bankAccountHolder"
                value={formData.bankAccountHolder}
                onChange={handleInputChange}
                placeholder="Atas nama pemilik toko"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
        </div>

        {/* SECTION 4: INTEGRASI PEMBAYARAN QRIS STATIS TOKO */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
            <div className="p-2 bg-brand-50 text-brand-600 rounded-lg">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">QRIS Statis Toko</h3>
              <p className="text-xs text-gray-500">
                Simpan foto barcode QRIS toko Anda. Saat kasir memilih metode QRIS, gambar ini akan langsung tampil di layar untuk dipindai pelanggan.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Upload Foto / Gambar QRIS Toko
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 text-xs font-medium text-gray-700">
                    <Upload className="w-4 h-4 text-gray-500" />
                    Pilih File Foto
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleQrisImageUpload}
                      className="hidden"
                    />
                  </label>
                  <span className="text-xs text-gray-500">Maksimal 2 MB (PNG / JPG)</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Atau Masukkan URL Gambar QRIS
                </label>
                <input
                  type="url"
                  name="qrisImageUrl"
                  value={formData.qrisImageUrl}
                  onChange={handleInputChange}
                  placeholder="https://domain.com/qris-toko.png"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  String Kode QRIS EMVCo (Opsional)
                </label>
                <input
                  type="text"
                  name="qrisString"
                  value={formData.qrisString}
                  onChange={handleInputChange}
                  placeholder="00020101021126..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono text-xs"
                />
              </div>
            </div>

            {/* Preview Box QRIS */}
            <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/70 min-h-[220px]">
              {formData.qrisImageUrl ? (
                <div className="flex flex-col items-center">
                  <img
                    src={formData.qrisImageUrl}
                    alt="Preview QRIS Toko"
                    className="max-h-48 max-w-full object-contain rounded-lg shadow-sm border border-gray-200 bg-white p-2"
                  />
                  <span className="text-xs text-green-700 font-semibold mt-2">
                    ✓ QRIS Siap Ditampilkan di Layar Kasir
                  </span>
                </div>
              ) : (
                <div className="text-center text-gray-400">
                  <QrCode className="w-16 h-16 mx-auto mb-2 opacity-40" />
                  <p className="text-xs font-medium">Belum ada foto QRIS yang diunggah</p>
                  <p className="text-[11px]">Unggah foto QRIS toko Anda agar kasir dapat menampilkannya</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* TOMBOL SIMPAN */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl shadow-md transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Menyimpan...' : 'Simpan Semua Pengaturan'}
          </button>
        </div>
      </form>
    </div>
  );
};
