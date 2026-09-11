// main.js
import { STORAGE_KEY, DARK_MODE_KEY, PHOTO_DB_NAME, PHOTO_DB_VERSION, getPhotoDB, savePhoto, deletePhoto, getPhoto, loadData, getDefaultData, cleanLegacyBase64, saveData } from './dataStorage.js';
import { formatRupiah, formatDateID, toNumber, normalizeDate } from './utils.js';

const PAGE_SIZE = 10;
let currentPage = { petani: 1, pengepul: 1, tp: 1, tpen: 1, biaya: 1 };
let data = loadData();

function loadAllThumbnails() {
  document.querySelectorAll('img[data-photo-store][data-photo-id]').forEach(img => {
    const store = img.getAttribute('data-photo-store');
    const id = Number(img.getAttribute('data-photo-id'));
    getPhoto(store, id).then(rec => {
      if (rec && rec.blob) {
        const url = URL.createObjectURL(rec.blob);
        img.src = url;
        img.dataset.foto = url;
      }
    });
  });
}

function attachPreviewEvents() {
  document.querySelectorAll('.foto-thumb').forEach(img => {
    img.onclick = () => {
      const src = img.dataset.foto || img.src;
      const modalImg = document.getElementById('previewFotoImg');
      if (modalImg) modalImg.src = src;
      const modal = document.getElementById('modalPreviewFoto');
      if (modal) modal.classList.remove('hidden');
    };
  });
  const closeBtn = document.querySelector('#modalPreviewFoto .btn-close');
  if (closeBtn) {
    closeBtn.onclick = () => {
      document.getElementById('modalPreviewFoto').classList.add('hidden');
    };
  }
}

function renderPagination(containerId, totalItems, key, renderFn) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  if (currentPage[key] > totalPages) currentPage[key] = totalPages;
  if (currentPage[key] < 1) currentPage[key] = 1;
  let html = `<div class="flex justify-between items-center text-sm">
    <div class="text-gray-500">Total: ${totalItems}</div>
    <nav>
      <ul class="inline-flex space-x-1">
        <li><button class="px-2 py-1 rounded ${currentPage[key]===1?'opacity-50 cursor-not-allowed':''}" data-page="${currentPage[key]-1}">Prev</button></li>
        <li><span class="px-2 py-1">${currentPage[key]} / ${totalPages}</span></li>
        <li><button class="px-2 py-1 rounded ${currentPage[key]===totalPages?'opacity-50 cursor-not-allowed':''}" data-page="${currentPage[key]+1}">Next</button></li>
      </ul>
    </nav>
  </div>`;
  container.innerHTML = html;
  container.querySelectorAll('button[data-page]').forEach(btn => {
    btn.onclick = e => {
      const p = Number(btn.dataset.page);
      if (p>=1 && p<=totalPages) {
        currentPage[key] = p;
        renderFn();
      }
    };
  });
}

// Navigation
document.querySelectorAll('#side-nav .nav-link').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const target = link.dataset.section;
    document.querySelectorAll('#side-nav .nav-link').forEach(l => l.classList.remove('active'));
    link.classList.add('active');
    document.querySelectorAll('section[id^="section-"]').forEach(sec => sec.classList.add('hidden'));
    const sec = document.getElementById('section-' + target);
    if (sec) sec.classList.remove('hidden');
  });
});

// Dark mode
function applyDarkModeFromStorage() {
  const val = localStorage.getItem(DARK_MODE_KEY);
  const isDark = val === '1';
  document.body.classList.toggle('dark', isDark);
  const btn = document.getElementById('btn-dark-mode');
  if (btn) btn.textContent = isDark ? 'Light Mode' : 'Dark Mode';
}

document.getElementById('btn-dark-mode').addEventListener('click', () => {
  const isDark = !document.body.classList.contains('dark');
  document.body.classList.toggle('dark', isDark);
  localStorage.setItem(DARK_MODE_KEY, isDark ? '1' : '0');
  applyDarkModeFromStorage();
// Mobile menu toggle for small screens
const sidebar=document.getElementById('sidebar');
const menuBtn=document.getElementById('btn-menu');
if(menuBtn && sidebar){
  menuBtn.addEventListener('click',()=>{
    sidebar.classList.toggle('hidden');
  });
}
});
applyDarkModeFromStorage();

// --- Render functions (Petani, Pengepul, Transaksi, Penjualan, Biaya) ---
function renderPetani() {
  const tbody = document.getElementById('table-petani-body');
  tbody.innerHTML = '';
  const start = (currentPage.petani - 1) * PAGE_SIZE;
  const pageData = data.petani.slice(start, start + PAGE_SIZE);
  pageData.forEach((p, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td class="px-2 py-1">${start + idx + 1}</td>
      <td class="px-2 py-1">${p.nama}</td>
      <td class="px-2 py-1">${p.fotoKTP ? `<img class="foto-thumb" data-photo-store="petaniPhotos" data-photo-id="${p.id}" class="h-8 w-8 cursor-pointer"/>` : '-'}</td>
      <td class="px-2 py-1">${p.catatan||''}</td>
      <td class="px-2 py-1 space-x-1">
        <button class="bg-gray-200 dark:bg-gray-700 text-sm px-2 py-1 rounded btn-edit-petani" data-id="${p.id}">Edit</button>
        <button class="bg-red-200 text-sm px-2 py-1 rounded btn-del-petani" data-id="${p.id}">Del</button>
      </td>`;
    tbody.appendChild(tr);
  });
  renderPagination('pagination-petani', data.petani.length, 'petani', renderPetani);

  tbody.querySelectorAll('.btn-del-petani').forEach(btn => {
    btn.onclick = () => {
      const id = Number(btn.dataset.id);
      if (!confirm('Hapus petani ini?')) return;
      const pet = data.petani.find(p=>p.id===id);
      if (pet && pet.fotoKTP) deletePhoto('petaniPhotos', id);
      data.petani = data.petani.filter(p=>p.id!==id);
      data.transaksiPetani = data.transaksiPetani.filter(t=>t.petaniId!==id);
      saveData(data);
      renderPetani();
    };
  });
  tbody.querySelectorAll('.btn-edit-petani').forEach(btn => {
    btn.onclick = () => {
      const id = Number(btn.dataset.id);
      const p = data.petani.find(p=>p.id===id);
      if (!p) return;
      document.getElementById('edit-petani-id').value = p.id;
      document.getElementById('edit-petani-nama').value = p.nama;
      document.getElementById('edit-petani-catatan').value = p.catatan||'';
      document.getElementById('edit-petani-foto').value = '';
      const preview = document.getElementById('preview-edit-petani-foto');
      preview.src = '';
      if (p.fotoKTP) {
        getPhoto('petaniPhotos', p.id).then(rec=>{ if(rec&&rec.blob) preview.src = URL.createObjectURL(rec.blob); });
      }
      document.getElementById('modalEditPetani').classList.remove('hidden');
    };
  });

  // update select options for transaksi petani
  const selAdd = document.getElementById('tp-petani-id');
  const selEdit = document.getElementById('edit-tp-petani-id');
  [selAdd, selEdit].forEach(sel=>{ sel.innerHTML = '<option value="">-- Pilih Petani --</option>'; });
  data.petani.forEach(p=>{
    const opt = document.createElement('option'); opt.value=p.id; opt.textContent=p.nama; selAdd.appendChild(opt.cloneNode(true)); selEdit.appendChild(opt);
  });

  loadAllThumbnails();
  attachPreviewEvents();
}

function renderPengepul() {
  const tbody = document.getElementById('table-pengepul-body');
  tbody.innerHTML = '';
  const start = (currentPage.pengepul - 1) * PAGE_SIZE;
  const pageData = data.pengepul.slice(start, start + PAGE_SIZE);
  pageData.forEach((p, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td class="px-2 py-1">${start + idx + 1}</td>
      <td class="px-2 py-1">${p.nama}</td>
      <td class="px-2 py-1">${p.catatan||''}</td>
      <td class="px-2 py-1 space-x-1">
        <button class="bg-gray-200 dark:bg-gray-700 text-sm px-2 py-1 rounded btn-edit-pengepul" data-id="${p.id}">Edit</button>
        <button class="bg-red-200 text-sm px-2 py-1 rounded btn-del-pengepul" data-id="${p.id}">Del</button>
      </td>`;
    tbody.appendChild(tr);
  });
  renderPagination('pagination-pengepul', data.pengepul.length, 'pengepul', renderPengepul);

  tbody.querySelectorAll('.btn-del-pengepul').forEach(btn => {
    btn.onclick = () => {
      const id = Number(btn.dataset.id);
      if (!confirm('Hapus pengepul ini?')) return;
      data.pengepul = data.pengepul.filter(p=>p.id!==id);
      data.penjualanPengepul = data.penjualanPengepul.filter(t=>t.pengepulId!==id);
      saveData(data);
      renderPengepul();
    };
  });
  tbody.querySelectorAll('.btn-edit-pengepul').forEach(btn => {
    btn.onclick = () => {
      const id = Number(btn.dataset.id);
      const p = data.pengepul.find(p=>p.id===id);
      if (!p) return;
      document.getElementById('edit-pengepul-id').value = p.id;
      document.getElementById('edit-pengepul-nama').value = p.nama;
      document.getElementById('edit-pengepul-catatan').value = p.catatan||'';
      document.getElementById('modalEditPengepul').classList.remove('hidden');
    };
  });

  const selAdd = document.getElementById('tpen-pengepul-id');
  const selEdit = document.getElementById('edit-tpen-pengepul-id');
  [selAdd, selEdit].forEach(sel=>{ sel.innerHTML = '<option value="">-- Pilih Pengepul --</option>'; });
  data.pengepul.forEach(p=>{
    const opt = document.createElement('option'); opt.value=p.id; opt.textContent=p.nama; selAdd.appendChild(opt.cloneNode(true)); selEdit.appendChild(opt);
  });
}

function renderTransaksiPetani() {
  const tbody = document.getElementById('table-transaksi-petani-body');
  tbody.innerHTML = '';
  const sorted = data.transaksiPetani.slice().sort((a,b)=>b.tanggal.localeCompare(a.tanggal));
  const start = (currentPage.tp - 1) * PAGE_SIZE;
  const pageData = sorted.slice(start, start + PAGE_SIZE);
  pageData.forEach((t, idx) => {
    const pet = data.petani.find(p=>p.id===t.petaniId);
    const tr = document.createElement('tr');
    tr.innerHTML = `<td class="px-2 py-1">${start + idx + 1}</td>
      <td class="px-2 py-1">${formatDateID(t.tanggal)}</td>
      <td class="px-2 py-1">${pet?pet.nama:'-'}</td>
      <td class="px-2 py-1 text-right">${t.jumlahKarungPanen}</td>
      <td class="px-2 py-1 text-right">${t.jumlahPupuk}</td>
      <td class="px-2 py-1 text-right">${t.hasilPompaKarung}</td>
      <td class="px-2 py-1 text-right">${t.hasilPetaniKarung}</td>
      <td class="px-2 py-1">${t.keterangan||''}</td>
      <td class="px-2 py-1 space-x-1">
        <button class="bg-gray-200 dark:bg-gray-700 text-sm px-2 py-1 rounded btn-edit-tp" data-id="${t.id}">Edit</button>
        <button class="bg-red-200 text-sm px-2 py-1 rounded btn-del-tp" data-id="${t.id}">Del</button>
      </td>`;
    tbody.appendChild(tr);
  });
  renderPagination('pagination-tp', sorted.length, 'tp', renderTransaksiPetani);
  tbody.querySelectorAll('.btn-del-tp').forEach(btn=>{
    btn.onclick=()=>{ const id=Number(btn.dataset.id); if(!confirm('Hapus transaksi?'))return; data.transaksiPetani=data.transaksiPetani.filter(t=>t.id!==id); saveData(data); renderTransaksiPetani(); };
  });
  tbody.querySelectorAll('.btn-edit-tp').forEach(btn=>{
    btn.onclick=()=>{ const id=Number(btn.dataset.id); const t=data.transaksiPetani.find(x=>x.id===id); if(!t)return; document.getElementById('edit-tp-id').value=t.id; document.getElementById('edit-tp-tanggal').value=t.tanggal; document.getElementById('edit-tp-petani-id').value=t.petaniId; document.getElementById('edit-tp-karung').value=t.jumlahKarungPanen; document.getElementById('edit-tp-pupuk').value=t.jumlahPupuk; document.getElementById('edit-tp-hasil-pompa').value=t.hasilPompaKarung; document.getElementById('edit-tp-hasil-petani').value=t.hasilPetaniKarung; document.getElementById('edit-tp-keterangan').value=t.keterangan||''; document.getElementById('modalEditTransaksiPetani').classList.remove('hidden'); };
  });
}

function renderPenjualanPengepul() {
  const tbody = document.getElementById('table-transaksi-pengepul-body');
  tbody.innerHTML = '';
  const sorted = data.penjualanPengepul.slice().sort((a,b)=>b.tanggal.localeCompare(a.tanggal));
  const start = (currentPage.tpen - 1) * PAGE_SIZE;
  const pageData = sorted.slice(start, start + PAGE_SIZE);
  pageData.forEach((t, idx) => {
    const pen = data.pengepul.find(p=>p.id===t.pengepulId);
    const tr = document.createElement('tr');
    tr.innerHTML = `<td class="px-2 py-1">${start + idx + 1}</td>
      <td class="px-2 py-1">${formatDateID(t.tanggal)}</td>
      <td class="px-2 py-1">${pen?pen.nama:'-'}</td>
      <td class="px-2 py-1 text-right">${t.jumlahKarung}</td>
      <td class="px-2 py-1 text-right">${t.totalKg}</td>
      <td class="px-2 py-1 text-right">${formatRupiah(t.hargaPerKg)}</td>
      <td class="px-2 py-1 text-right">${formatRupiah(t.totalHarga)}</td>
      <td class="px-2 py-1">${t.statusPembayaran}</td>
      <td class="px-2 py-1">${t.metodePembayaran}</td>
      <td class="px-2 py-1">${t.fotoBukti ? `<img class="foto-thumb" data-photo-store="penjualanPhotos" data-photo-id="${t.id}" class="h-8 w-8 cursor-pointer"/>` : '-'}
      </td>
      <td class="px-2 py-1">${t.keterangan||''}</td>
      <td class="px-2 py-1 space-x-1">
        <button class="bg-gray-200 dark:bg-gray-700 text-sm px-2 py-1 rounded btn-edit-tpen" data-id="${t.id}">Edit</button>
        <button class="bg-red-200 text-sm px-2 py-1 rounded btn-del-tpen" data-id="${t.id}">Del</button>
      </td>`;
    tbody.appendChild(tr);
  });
  renderPagination('pagination-tpen', sorted.length, 'tpen', renderPenjualanPengepul);
  tbody.querySelectorAll('.btn-del-tpen').forEach(btn=>{
    btn.onclick=()=>{ const id=Number(btn.dataset.id); if(!confirm('Hapus penjualan?'))return; const t=data.penjualanPengepul.find(x=>x.id===id); if(t && t.fotoBukti) deletePhoto('penjualanPhotos', id); data.penjualanPengepul=data.penjualanPengepul.filter(t=>t.id!==id); saveData(data); renderPenjualanPengepul(); };
  });
  tbody.querySelectorAll('.btn-edit-tpen').forEach(btn=>{
    btn.onclick=()=>{ const id=Number(btn.dataset.id); const t=data.penjualanPengepul.find(x=>x.id===id); if(!t)return; document.getElementById('edit-tpen-id').value=t.id; document.getElementById('edit-tpen-tanggal').value=t.tanggal; document.getElementById('edit-tpen-pengepul-id').value=t.pengepulId; document.getElementById('edit-tpen-karung').value=t.jumlahKarung; document.getElementById('edit-tpen-totalkg').value=t.totalKg; document.getElementById('edit-tpen-harga-kg').value=t.hargaPerKg; document.getElementById('edit-tpen-total-harga').value=t.totalHarga; document.getElementById('edit-tpen-status').value=t.statusPembayaran||'Lunas'; document.getElementById('edit-tpen-metode').value=t.metodePembayaran||'Tunai'; document.getElementById('edit-tpen-keterangan').value=t.keterangan||''; document.getElementById('edit-tpen-foto').value=''; const preview=document.getElementById('preview-edit-tpen-foto'); preview.src=''; if(t.fotoBukti){ getPhoto('penjualanPhotos', t.id).then(rec=>{ if(rec&&rec.blob) preview.src=URL.createObjectURL(rec.blob); }); } document.getElementById('modalEditPenjualanPengepul').classList.remove('hidden'); };
  });
  loadAllThumbnails();
  attachPreviewEvents();
}

function renderBiaya() {
  const tbody=document.getElementById('table-biaya-body');
  tbody.innerHTML='';
  const sorted=data.biaya.slice().sort((a,b)=>b.tanggal.localeCompare(a.tanggal));
  const start=(currentPage.biaya-1)*PAGE_SIZE;
  const pageData=sorted.slice(start,start+PAGE_SIZE);
  pageData.forEach((b,idx)=>{
    const tr=document.createElement('tr');
    tr.innerHTML=`<td class="px-2 py-1">${start+idx+1}</td>
      <td class="px-2 py-1">${formatDateID(b.tanggal)}</td>
      <td class="px-2 py-1">${b.kategori}</td>
      <td class="px-2 py-1">${b.deskripsi||''}</td>
      <td class="px-2 py-1 text-right">${formatRupiah(b.nominal)}</td>
      <td class="px-2 py-1">${b.fotoBukti ? `<img class="foto-thumb" data-photo-store="biayaPhotos" data-photo-id="${b.id}" class="h-8 w-8 cursor-pointer"/>` : '-'}
      </td>
      <td class="px-2 py-1 space-x-1">
        <button class="bg-gray-200 dark:bg-gray-700 text-sm px-2 py-1 rounded btn-edit-biaya" data-id="${b.id}">Edit</button>
        <button class="bg-red-200 text-sm px-2 py-1 rounded btn-del-biaya" data-id="${b.id}">Del</button>
      </td>`;
    tbody.appendChild(tr);
  });
  renderPagination('pagination-biaya', sorted.length, 'biaya', renderBiaya);
  tbody.querySelectorAll('.btn-del-biaya').forEach(btn=>{ btn.onclick=()=>{ const id=Number(btn.dataset.id); if(!confirm('Hapus biaya?'))return; const b=data.biaya.find(x=>x.id===id); if(b && b.fotoBukti) deletePhoto('biayaPhotos', id); data.biaya=data.biaya.filter(b=>b.id!==id); saveData(data); renderBiaya(); }; });
  tbody.querySelectorAll('.btn-edit-biaya').forEach(btn=>{ btn.onclick=()=>{ const id=Number(btn.dataset.id); const b=data.biaya.find(x=>x.id===id); if(!b)return; document.getElementById('edit-biaya-id').value=b.id; document.getElementById('edit-biaya-tanggal').value=b.tanggal; document.getElementById('edit-biaya-kategori').value=b.kategori; document.getElementById('edit-biaya-deskripsi').value=b.deskripsi||''; document.getElementById('edit-biaya-nominal').value=b.nominal; document.getElementById('edit-biaya-foto').value=''; const preview=document.getElementById('preview-edit-biaya-foto'); preview.src=''; if(b.fotoBukti){ getPhoto('biayaPhotos', b.id).then(rec=>{ if(rec&&rec.blob) preview.src=URL.createObjectURL(rec.blob); }); } document.getElementById('modalEditBiaya').classList.remove('hidden'); }; });
  loadAllThumbnails();
  attachPreviewEvents();
}

// Dashboard calculations
function updateDashboard() {
  const start=document.getElementById('dash-start')?.value;
  const end=document.getElementById('dash-end')?.value;
  const inRange=date=>{ if(!date) return false; if(start && date<start) return false; if(end && date>end) return false; return true; };
  const filteredPenjualan=data.penjualanPengepul.filter(t=>inRange(t.tanggal));
  const filteredBiaya=data.biaya.filter(b=>inRange(b.tanggal));
  const filteredTP=data.transaksiPetani.filter(tp=>inRange(tp.tanggal));
  const totalPemasukan=filteredPenjualan.reduce((sum,t)=>sum+t.totalHarga,0);
  const totalBiaya=filteredBiaya.reduce((sum,b)=>sum+b.nominal,0);
  const laba=totalPemasukan-totalBiaya;
  document.getElementById('dash-total-pemasukan').textContent=formatRupiah(totalPemasukan);
  document.getElementById('dash-total-biaya').textContent=formatRupiah(totalBiaya);
  document.getElementById('dash-laba-rugi').textContent=formatRupiah(laba);
  const totalPompa=filteredTP.reduce((sum,tp)=>sum+tp.hasilPompaKarung,0);
  const totalPetani=filteredTP.reduce((sum,tp)=>sum+tp.hasilPetaniKarung,0);
  document.getElementById('dash-bagi-pompa').textContent=`${totalPompa} Karung`;
  document.getElementById('dash-bagi-petani').textContent=`${totalPetani} Karung`;
}

document.getElementById('dash-start')?.addEventListener('change', updateDashboard);
document.getElementById('dash-end')?.addEventListener('change', updateDashboard);

// Form handlers (Petani, Pengepul, Transaksi, Penjualan, Biaya)
document.getElementById('form-petani').addEventListener('submit', e=>{ e.preventDefault(); const nama=document.getElementById('petani-nama').value.trim(); const catatan=document.getElementById('petani-catatan').value.trim(); const file=document.getElementById('petani-foto').files[0]; if(!nama) return; const id=Date.now(); const finalize=hasFoto=>{ data.petani.push({id,nama,catatan,fotoKTP:!!hasFoto}); document.getElementById('petani-nama').value=''; document.getElementById('petani-catatan').value=''; document.getElementById('petani-foto').value=''; saveData(data); renderPetani(); };
  if(file){ savePhoto('petaniPhotos', id, file).then(()=>finalize(true)); } else { finalize(false); }
});

document.getElementById('form-pengepul').addEventListener('submit', e=>{ e.preventDefault(); const nama=document.getElementById('pengepul-nama').value.trim(); const catatan=document.getElementById('pengepul-catatan').value.trim(); if(!nama) return; data.pengepul.push({id:Date.now(), nama, catatan}); document.getElementById('pengepul-nama').value=''; document.getElementById('pengepul-catatan').value=''; saveData(data); renderPengepul(); });

// Transaksi Petani submit
document.getElementById('form-transaksi-petani').addEventListener('submit', e=>{ e.preventDefault(); const tanggal=document.getElementById('tp-tanggal').value; const petaniId=Number(document.getElementById('tp-petani-id').value); const jumlahKarungPanen=toNumber(document.getElementById('tp-karung').value); const jumlahPupuk=toNumber(document.getElementById('tp-pupuk').value); const hasilPompaKarung=toNumber(document.getElementById('tp-hasil-pompa').value); const hasilPetaniKarung=toNumber(document.getElementById('tp-hasil-petani').value); const keterangan=document.getElementById('tp-keterangan').value.trim(); if(!tanggal||!petaniId) return; data.transaksiPetani.push({id:Date.now(), tanggal, petaniId, jumlahKarungPanen, jumlahPupuk, hasilPompaKarung, hasilPetaniKarung, keterangan}); document.getElementById('tp-tanggal').value=''; document.getElementById('tp-petani-id').value=''; document.getElementById('tp-karung').value=''; document.getElementById('tp-pupuk').value=''; document.getElementById('tp-hasil-pompa').value=''; document.getElementById('tp-hasil-petani').value=''; document.getElementById('tp-keterangan').value=''; saveData(data); renderTransaksiPetani(); });

// Penjualan Pengepul submit
function updatePenjualanTotal(){ const totalKg=toNumber(document.getElementById('tpen-totalkg').value); const harga=toNumber(document.getElementById('tpen-harga-kg').value); document.getElementById('tpen-total-harga').value=totalKg*harga; }
document.getElementById('tpen-totalkg').addEventListener('input', updatePenjualanTotal);
document.getElementById('tpen-harga-kg').addEventListener('input', updatePenjualanTotal);

document.getElementById('form-transaksi-pengepul').addEventListener('submit', e=>{ e.preventDefault(); const tanggal=document.getElementById('tpen-tanggal').value; const pengepulId=Number(document.getElementById('tpen-pengepul-id').value); const jumlahKarung=toNumber(document.getElementById('tpen-karung').value); const totalKg=toNumber(document.getElementById('tpen-totalkg').value); const hargaPerKg=toNumber(document.getElementById('tpen-harga-kg').value); const totalHarga=toNumber(document.getElementById('tpen-total-harga').value) || totalKg*hargaPerKg; const statusPembayaran=document.getElementById('tpen-status').value; const metode=document.getElementById('tpen-metode').value; const keterangan=document.getElementById('tpen-keterangan').value.trim(); const file=document.getElementById('tpen-foto').files[0]; if(!tanggal||!pengepulId) return; const id=Date.now(); const finalize=hasFoto=>{ data.penjualanPengepul.push({id, tanggal, pengepulId, jumlahKarung, totalKg, hargaPerKg, totalHarga, statusPembayaran, metodePembayaran:metode, keterangan, fotoBukti:!!hasFoto}); document.getElementById('tpen-tanggal').value=''; document.getElementById('tpen-pengepul-id').value=''; document.getElementById('tpen-karung').value=''; document.getElementById('tpen-totalkg').value=''; document.getElementById('tpen-harga-kg').value=''; document.getElementById('tpen-total-harga').value=''; document.getElementById('tpen-status').value='Lunas'; document.getElementById('tpen-metode').value='Tunai'; document.getElementById('tpen-keterangan').value=''; document.getElementById('tpen-foto').value=''; saveData(data); renderPenjualanPengepul(); };
  if(file){ savePhoto('penjualanPhotos', id, file).then(()=>finalize(true)); } else { finalize(false); }
});

// Biaya submit
document.getElementById('form-biaya').addEventListener('submit', e=>{ e.preventDefault(); const tanggal=document.getElementById('biaya-tanggal').value; const kategori=document.getElementById('biaya-kategori').value; const deskripsi=document.getElementById('biaya-deskripsi').value.trim(); const nominal=toNumber(document.getElementById('biaya-nominal').value); const file=document.getElementById('biaya-foto').files[0]; if(!tanggal||!nominal) return; const id=Date.now(); const finalize=hasFoto=>{ data.biaya.push({id, tanggal, kategori, deskripsi, nominal, fotoBukti:!!hasFoto}); document.getElementById('biaya-tanggal').value=''; document.getElementById('biaya-deskripsi').value=''; document.getElementById('biaya-nominal').value=''; document.getElementById('biaya-foto').value=''; saveData(data); renderBiaya(); };
  if(file){ savePhoto('biayaPhotos', id, file).then(() =>finalize(true)); } else { finalize(false); }
});

// Edit form handlers
document.getElementById('form-edit-petani').addEventListener('submit', e => {
  e.preventDefault();
  const id = Number(document.getElementById('edit-petani-id').value);
  const nama = document.getElementById('edit-petani-nama').value.trim();
  const catatan = document.getElementById('edit-petani-catatan').value.trim();
  const file = document.getElementById('edit-petani-foto').files[0];
  const idx = data.petani.findIndex(p => p.id === id);
  if (idx < 0) return;
  data.petani[idx].nama = nama;
  data.petani[idx].catatan = catatan;

  const doneSave = hasFoto => {
    if (hasFoto !== null) data.petani[idx].fotoKTP = hasFoto;
    saveData(data);
    renderPetani();
    document.getElementById('modalEditPetani').classList.add('hidden');
  };

  if (file) {
    savePhoto('petaniPhotos', id, file).then(() => doneSave(true));
  } else {
    doneSave(null);
  }
});

document.getElementById('form-edit-pengepul').addEventListener('submit', e => {
  e.preventDefault();
  const id = Number(document.getElementById('edit-pengepul-id').value);
  const nama = document.getElementById('edit-pengepul-nama').value.trim();
  const catatan = document.getElementById('edit-pengepul-catatan').value.trim();
  const idx = data.pengepul.findIndex(p => p.id === id);
  if (idx >= 0) {
    data.pengepul[idx].nama = nama;
    data.pengepul[idx].catatan = catatan;
    saveData(data);
    renderPengepul();
    document.getElementById('modalEditPengepul').classList.add('hidden');
  }
});

document.getElementById('form-edit-transaksi-petani').addEventListener('submit', e => {
  e.preventDefault();
  const id = Number(document.getElementById('edit-tp-id').value);
  const tanggal = document.getElementById('edit-tp-tanggal').value;
  const petaniId = Number(document.getElementById('edit-tp-petani-id').value);
  const jumlahKarungPanen = toNumber(document.getElementById('edit-tp-karung').value);
  const jumlahPupuk = toNumber(document.getElementById('edit-tp-pupuk').value);
  const hasilPompaKarung = toNumber(document.getElementById('edit-tp-hasil-pompa').value);
  const hasilPetaniKarung = toNumber(document.getElementById('edit-tp-hasil-petani').value);
  const keterangan = document.getElementById('edit-tp-keterangan').value.trim();
  const idx = data.transaksiPetani.findIndex(t => t.id === id);
  if (idx >= 0) {
    data.transaksiPetani[idx] = { id, tanggal, petaniId, jumlahKarungPanen, jumlahPupuk, hasilPompaKarung, hasilPetaniKarung, keterangan };
    saveData(data);
    renderTransaksiPetani();
    document.getElementById('modalEditTransaksiPetani').classList.add('hidden');
  }
});

document.getElementById('form-edit-penjualan-pengepul').addEventListener('submit', e => {
  e.preventDefault();
  const id = Number(document.getElementById('edit-tpen-id').value);
  const tanggal = document.getElementById('edit-tpen-tanggal').value;
  const pengepulId = Number(document.getElementById('edit-tpen-pengepul-id').value);
  const jumlahKarung = toNumber(document.getElementById('edit-tpen-karung').value);
  const totalKg = toNumber(document.getElementById('edit-tpen-totalkg').value);
  const hargaPerKg = toNumber(document.getElementById('edit-tpen-harga-kg').value);
  const totalHarga = toNumber(document.getElementById('edit-tpen-total-harga').value) || (totalKg * hargaPerKg);
  const statusPembayaran = document.getElementById('edit-tpen-status').value || 'Lunas';
  const metodePembayaran = document.getElementById('edit-tpen-metode').value || 'Tunai';
  const keterangan = document.getElementById('edit-tpen-keterangan').value.trim();
  const file = document.getElementById('edit-tpen-foto').files[0];
  const idx = data.penjualanPengepul.findIndex(t => t.id === id);
  if (idx < 0) return;

  data.penjualanPengepul[idx].tanggal = tanggal;
  data.penjualanPengepul[idx].pengepulId = pengepulId;
  data.penjualanPengepul[idx].jumlahKarung = jumlahKarung;
  data.penjualanPengepul[idx].totalKg = totalKg;
  data.penjualanPengepul[idx].hargaPerKg = hargaPerKg;
  data.penjualanPengepul[idx].totalHarga = totalHarga;
  data.penjualanPengepul[idx].statusPembayaran = statusPembayaran;
  data.penjualanPengepul[idx].metodePembayaran = metodePembayaran;
  data.penjualanPengepul[idx].keterangan = keterangan;

  const doneSave = hasFoto => {
    if (hasFoto !== null) data.penjualanPengepul[idx].fotoBukti = hasFoto;
    saveData(data);
    renderPenjualanPengepul();
    document.getElementById('modalEditPenjualanPengepul').classList.add('hidden');
  };

  if (file) {
    savePhoto('penjualanPhotos', id, file).then(() => doneSave(true));
  } else {
    doneSave(null);
  }
});

document.getElementById('form-edit-biaya').addEventListener('submit', e => {
  e.preventDefault();
  const id = Number(document.getElementById('edit-biaya-id').value);
  const tanggal = document.getElementById('edit-biaya-tanggal').value;
  const kategori = document.getElementById('edit-biaya-kategori').value;
  const deskripsi = document.getElementById('edit-biaya-deskripsi').value.trim();
  const nominal = toNumber(document.getElementById('edit-biaya-nominal').value);
  const file = document.getElementById('edit-biaya-foto').files[0];
  const idx = data.biaya.findIndex(b => b.id === id);
  if (idx < 0) return;

  data.biaya[idx].tanggal = tanggal;
  data.biaya[idx].kategori = kategori;
  data.biaya[idx].deskripsi = deskripsi;
  data.biaya[idx].nominal = nominal;

  const doneSave = hasFoto => {
    if (hasFoto !== null) data.biaya[idx].fotoBukti = hasFoto;
    saveData(data);
    renderBiaya();
    document.getElementById('modalEditBiaya').classList.add('hidden');
  };

  if (file) {
    savePhoto('biayaPhotos', id, file).then(() => doneSave(true));
  } else {
    doneSave(null);
  }
});


// Biaya submit
document.getElementById('form-biaya').addEventListener('submit', e=>{ e.preventDefault(); const tanggal=document.getElementById('biaya-tanggal').value; const kategori=document.getElementById('biaya-kategori').value; const deskripsi=document.getElementById('biaya-deskripsi').value.trim(); const nominal=toNumber(document.getElementById('biaya-nominal').value); const file=document.getElementById('biaya-foto').files[0]; if(!tanggal||!nominal) return; const id=Date.now(); const finalize=hasFoto=>{ data.biaya.push({id, tanggal, kategori, deskripsi, nominal, fotoBukti:!!hasFoto}); document.getElementById('biaya-tanggal').value=''; document.getElementById('biaya-deskripsi').value=''; document.getElementById('biaya-nominal').value=''; document.getElementById('biaya-foto').value=''; saveData(data); renderBiaya(); };
  if(file){ savePhoto('biayaPhotos', id, file).then(()=>finalize(true)); } else { finalize(false); }
});

// Laporan calculation
document.getElementById('btn-hitung-laporan').addEventListener('click', ()=>{ const start=document.getElementById('laporan-start').value; const end=document.getElementById('laporan-end').value; const inRange=date=>{ if(!date) return false; if(start && date<start) return false; if(end && date>end) return false; return true; };
  const penjualan=data.penjualanPengepul.filter(t=>inRange(t.tanggal));
  const biaya=data.biaya.filter(b=>inRange(b.tanggal));
  const totalPenjualan=penjualan.reduce((s,t)=>s+t.totalHarga,0);
  const totalBiaya=biaya.reduce((s,b)=>s+b.nominal,0);
  const laba=totalPenjualan-totalBiaya;
  document.getElementById('lap-total-pemasukan').textContent=formatRupiah(totalPenjualan);
  document.getElementById('lap-total-biaya').textContent=formatRupiah(totalBiaya);
  document.getElementById('lap-laba-rugi').textContent=formatRupiah(laba);
});


// --- Backup & Restore ---

document.getElementById('btn-export-json').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'data-pembukuan-pompa.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

document.getElementById('input-import-json').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  if (!confirm('Import JSON akan menimpa semua data. Lanjutkan?')) {
    e.target.value = '';
    return;
  }
  const reader = new FileReader();
  reader.onload = evt => {
    try {
      const imported = JSON.parse(evt.target.result);
      if (!imported || typeof imported !== 'object') throw new Error('Format tidak sesuai');
      
      // Normalize dates in imported JSON
      if (Array.isArray(imported.transaksiPetani)) {
        imported.transaksiPetani.forEach(t => t.tanggal = normalizeDate(t.tanggal));
      }
      if (Array.isArray(imported.penjualanPengepul)) {
        imported.penjualanPengepul.forEach(t => t.tanggal = normalizeDate(t.tanggal));
      }
      if (Array.isArray(imported.biaya)) {
        imported.biaya.forEach(b => b.tanggal = normalizeDate(b.tanggal));
      }

      data = Object.assign(loadData(), imported);
      saveData(data);
      alert('Import JSON berhasil.\\nCatatan: Foto tidak ikut, karena tersimpan lokal di IndexedDB.');
    } catch (err) {
      console.error(err);
      alert('File JSON tidak valid.');
    } finally {
      e.target.value = '';
    }
  };
  reader.readAsText(file);
});

document.getElementById('btn-export-excel').addEventListener('click', () => {
  try {
    const wb = XLSX.utils.book_new();
    const petaniSheet = XLSX.utils.json_to_sheet(data.petani.map(p => ({ id: p.id, nama: p.nama, catatan: p.catatan || '' })));
    XLSX.utils.book_append_sheet(wb, petaniSheet, 'petani');
    const pengepulSheet = XLSX.utils.json_to_sheet(data.pengepul.map(p => ({ id: p.id, nama: p.nama, catatan: p.catatan || '' })));
    XLSX.utils.book_append_sheet(wb, pengepulSheet, 'pengepul');
    const tpSheet = XLSX.utils.json_to_sheet(data.transaksiPetani.map(t => ({ id: t.id, tanggal: t.tanggal, petaniId: t.petaniId, jumlahKarungPanen: t.jumlahKarungPanen, jumlahPupuk: t.jumlahPupuk, hasilPompaKarung: t.hasilPompaKarung, hasilPetaniKarung: t.hasilPetaniKarung, keterangan: t.keterangan || '' })));
    XLSX.utils.book_append_sheet(wb, tpSheet, 'transaksi_petani');
    const tpenSheet = XLSX.utils.json_to_sheet(data.penjualanPengepul.map(t => ({ id: t.id, tanggal: t.tanggal, pengepulId: t.pengepulId, jumlahKarung: t.jumlahKarung, totalKg: t.totalKg, hargaPerKg: t.hargaPerKg, totalHarga: t.totalHarga, statusPembayaran: t.statusPembayaran, metodePembayaran: t.metodePembayaran, keterangan: t.keterangan || '' })));
    XLSX.utils.book_append_sheet(wb, tpenSheet, 'penjualan_pengepul');
    const biayaSheet = XLSX.utils.json_to_sheet(data.biaya.map(b => ({ id: b.id, tanggal: b.tanggal, kategori: b.kategori, deskripsi: b.deskripsi || '', nominal: b.nominal })));
    XLSX.utils.book_append_sheet(wb, biayaSheet, 'biaya');
    XLSX.writeFile(wb, 'data-pembukuan-pompa.xlsx');
  } catch (err) {
    console.error(err);
    alert('Gagal export Excel.');
  }
});

document.getElementById('input-import-excel').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  if (!confirm('Import Excel akan menimpa semua data. Pastikan file berasal dari export aplikasi ini. Lanjutkan?')) {
    e.target.value = '';
    return;
  }
  const reader = new FileReader();
  reader.onload = evt => {
    try {
      const wb = XLSX.read(evt.target.result, { type: 'binary' });
      const imported = loadData();
      const readSheet = (name, handler) => {
        const sheet = wb.Sheets[name];
        if (!sheet) return;
        handler(XLSX.utils.sheet_to_json(sheet));
      };
      readSheet('petani', rows => { imported.petani = rows.map((r, idx) => ({ id: Number(r.id) || Date.now() + idx, nama: r.nama || '', catatan: r.catatan || '' })); });
      readSheet('pengepul', rows => { imported.pengepul = rows.map((r, idx) => ({ id: Number(r.id) || Date.now() + idx, nama: r.nama || '', catatan: r.catatan || '' })); });
      readSheet('transaksi_petani', rows => { imported.transaksiPetani = rows.map((r, idx) => ({ id: Number(r.id) || Date.now() + idx, tanggal: normalizeDate(r.tanggal), petaniId: Number(r.petaniId) || 0, jumlahKarungPanen: toNumber(r.jumlahKarungPanen), jumlahPupuk: toNumber(r.jumlahPupuk), hasilPompaKarung: toNumber(r.hasilPompaKarung), hasilPetaniKarung: toNumber(r.hasilPetaniKarung), keterangan: r.keterangan || '' })); });
      readSheet('penjualan_pengepul', rows => { 
        imported.penjualanPengepul = rows.map((r, idx) => { 
          const tk = toNumber(r.totalKg); 
          const hp = toNumber(r.hargaPerKg); 
          return { 
            id: Number(r.id) || Date.now() + idx, 
            tanggal: normalizeDate(r.tanggal), 
            pengepulId: Number(r.pengepulId) || 0, 
            jumlahKarung: toNumber(r.jumlahKarung), 
            totalKg: tk, 
            hargaPerKg: hp, 
            totalHarga: toNumber(r.totalHarga) || (tk * hp), 
            statusPembayaran: r.statusPembayaran || 'Lunas', 
            metodePembayaran: r.metodePembayaran || 'Tunai', 
            keterangan: r.keterangan || '', 
            fotoBukti: false 
          }; 
        }); 
      });
      readSheet('biaya', rows => { imported.biaya = rows.map((r, idx) => ({ id: Number(r.id) || Date.now() + idx, tanggal: normalizeDate(r.tanggal), kategori: r.kategori || 'Lain-lain', deskripsi: r.deskripsi || '', nominal: toNumber(r.nominal), fotoBukti: false })); });
      data = imported;
      saveData(data);
      alert('Import Excel berhasil.\\nCatatan: Foto tidak ikut import.');
    } catch (err) {
      console.error(err);
      alert('File Excel tidak valid atau format sheet tidak sesuai.');
    } finally {
      e.target.value = '';
    }
  };
  reader.readAsBinaryString(file);
});

// Google Sheets Sync
const GSHEET_URL_KEY = 'pompanisasi_gsheet_url';
const inputGSheetUrl = document.getElementById('input-gsheet-url');
const btnSyncGSheet = document.getElementById('btn-sync-gsheet');
const btnDownloadGSheet = document.getElementById('btn-download-gsheet');
const syncStatus = document.getElementById('sync-status');

if (localStorage.getItem(GSHEET_URL_KEY)) {
  inputGSheetUrl.value = localStorage.getItem(GSHEET_URL_KEY);
}

btnSyncGSheet.addEventListener('click', async () => {
  const url = inputGSheetUrl.value.trim();
  if (!url) {
    alert('Masukkan URL Google Apps Script Web App terlebih dahulu.');
    return;
  }
  localStorage.setItem(GSHEET_URL_KEY, url);
  btnSyncGSheet.disabled = true;
  syncStatus.style.display = 'block';
  syncStatus.className = 'text-sm mt-2 text-primary';
  syncStatus.innerHTML = 'Sedang mengunggah data...';
  try {
    const syncData = {
      petani: data.petani.map(p => ({ id: p.id, nama: p.nama, catatan: p.catatan || '' })),
      pengepul: data.pengepul.map(p => ({ id: p.id, nama: p.nama, catatan: p.catatan || '' })),
      transaksiPetani: data.transaksiPetani,
      penjualanPengepul: data.penjualanPengepul,
      biaya: data.biaya,
      timestamp: new Date().toISOString()
    };
    await fetch(url, { method: 'POST', mode: 'no-cors', cache: 'no-cache', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(syncData) });
    syncStatus.className = 'text-sm mt-2 text-success';
    syncStatus.innerHTML = 'Data berhasil dikirim ke Google Sheets!';
    setTimeout(() => { syncStatus.style.display = 'none'; }, 5000);
  } catch (err) {
    console.error('Sync error:', err);
    syncStatus.className = 'text-sm mt-2 text-danger';
    syncStatus.innerHTML = 'Gagal mengunggah data.';
  } finally {
    btnSyncGSheet.disabled = false;
  }
});

btnDownloadGSheet.addEventListener('click', async () => {
  const url = inputGSheetUrl.value.trim();
  if (!url) {
    alert('Masukkan URL Google Apps Script Web App terlebih dahulu.');
    return;
  }
  if (!confirm('Download data akan menimpa data lokal. Lanjutkan?')) return;
  localStorage.setItem(GSHEET_URL_KEY, url);
  btnDownloadGSheet.disabled = true;
  syncStatus.style.display = 'block';
  syncStatus.className = 'text-sm mt-2 text-primary';
  syncStatus.innerHTML = 'Sedang mengambil data...';
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Network response was not ok');
    const imported = await response.json();
    if (imported.status === 'error') throw new Error(imported.message);
    if (Array.isArray(imported.petani)) imported.petani = imported.petani.map(p => ({ ...p, id: Number(p.id) }));
    if (Array.isArray(imported.pengepul)) imported.pengepul = imported.pengepul.map(p => ({ ...p, id: Number(p.id) }));
    if (Array.isArray(imported.transaksiPetani)) {
      imported.transaksiPetani = imported.transaksiPetani.map(t => ({ ...t, id: Number(t.id), petaniId: Number(t.petaniId), tanggal: normalizeDate(t.tanggal), jumlahKarungPanen: toNumber(t.jumlahKarungPanen), jumlahPupuk: toNumber(t.jumlahPupuk), hasilPompaKarung: toNumber(t.hasilPompaKarung), hasilPetaniKarung: toNumber(t.hasilPetaniKarung) }));
    }
    if (Array.isArray(imported.penjualanPengepul)) {
      imported.penjualanPengepul = imported.penjualanPengepul.map(t => ({ ...t, id: Number(t.id), pengepulId: Number(t.pengepulId), tanggal: normalizeDate(t.tanggal), jumlahKarung: toNumber(t.jumlahKarung), totalKg: toNumber(t.totalKg), hargaPerKg: toNumber(t.hargaPerKg), totalHarga: toNumber(t.totalHarga), fotoBukti: false }));
    }
    if (Array.isArray(imported.biaya)) {
      imported.biaya = imported.biaya.map(b => ({ ...b, id: Number(b.id), tanggal: normalizeDate(b.tanggal), nominal: toNumber(b.nominal), fotoBukti: false }));
    }
    data = Object.assign(loadData(), imported);
    saveData(data);
    syncStatus.className = 'text-sm mt-2 text-success';
    syncStatus.innerHTML = 'Data berhasil diunduh dari Google Sheets!';
    setTimeout(() => { syncStatus.style.display = 'none'; }, 5000);
  } catch (err) {
    console.error('Download error:', err);
    syncStatus.className = 'text-sm mt-2 text-danger';
    syncStatus.innerHTML = 'Gagal mengambil data.';
  } finally {
    btnDownloadGSheet.disabled = false;
  }
});

document.getElementById('btn-clear-data').addEventListener('click', () => {
  if (confirm("Semua data akan dihapus permanen (termasuk foto di IndexedDB). Lanjutkan?")) {
    localStorage.removeItem(STORAGE_KEY);
    data = loadData();
    if ('indexedDB' in window) {
      indexedDB.deleteDatabase(PHOTO_DB_NAME);
    }
    saveData(data);
    alert("Semua data berhasil dihapus.");
    location.reload();
  }
});

// Initial render
renderPetani();
renderPengepul();
renderTransaksiPetani();
renderPenjualanPengepul();
renderBiaya();
updateDashboard();
