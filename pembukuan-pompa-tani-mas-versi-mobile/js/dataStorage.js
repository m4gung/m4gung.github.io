// dataStorage.js
import { toNumber, normalizeDate } from './utils.js';

export const STORAGE_KEY = 'pembukuan_pompanisasi_data_v4';
export const DARK_MODE_KEY = 'pembukuan_pompanisasi_dark_mode';
export const PHOTO_DB_NAME = 'pompanisasi_photos_db';
export const PHOTO_DB_VERSION = 1;

let photoDBPromise = null;

export function getPhotoDB() {
  if (!('indexedDB' in window)) {
    console.warn('IndexedDB tidak tersedia. Foto tidak akan disimpan.');
    return Promise.reject('IndexedDB not supported');
  }
  if (!photoDBPromise) {
    photoDBPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(PHOTO_DB_NAME, PHOTO_DB_VERSION);
      req.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('petaniPhotos')) db.createObjectStore('petaniPhotos', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('penjualanPhotos')) db.createObjectStore('penjualanPhotos', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('biayaPhotos')) db.createObjectStore('biayaPhotos', { keyPath: 'id' });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return photoDBPromise;
}

export function savePhoto(storeName, id, file) {
  if (!file) return Promise.resolve();
  return getPhotoDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    store.put({ id, blob: file, updatedAt: Date.now() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  }));
}

export function deletePhoto(storeName, id) {
  return getPhotoDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    store.delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  }));
}

export function getPhoto(storeName, id) {
  return getPhotoDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  }));
}

export function loadData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return getDefaultData();
  try {
    const obj = JSON.parse(raw);
    return Object.assign(getDefaultData(), obj);
  } catch (e) {
    console.error('Gagal parse data, pakai default.', e);
    return getDefaultData();
  }
}

export function getDefaultData() {
  return { petani: [], pengepul: [], transaksiPetani: [], penjualanPengepul: [], biaya: [] };
}

export function cleanLegacyBase64(data) {
  data.petani.forEach(p => { if (p.fotoKTP && typeof p.fotoKTP === 'string' && p.fotoKTP.startsWith('data:')) p.fotoKTP = true; });
  data.penjualanPengepul.forEach(t => { if (t.fotoBukti && typeof t.fotoBukti === 'string' && t.fotoBukti.startsWith('data:')) t.fotoBukti = true; });
  data.biaya.forEach(b => { if (b.fotoBukti && typeof b.fotoBukti === 'string' && b.fotoBukti.startsWith('data:')) b.fotoBukti = true; });
}

export function saveData(data) {
  cleanLegacyBase64(data);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}