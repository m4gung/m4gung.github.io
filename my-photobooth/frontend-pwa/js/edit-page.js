const EditPage = {
  canvas: null,
  ctx: null,
  currentLayout: 'strip-3',
  photos: [],
  maxPhotos: 3,
  stickers: [],
  captureSlotIndex: null,
  stream: null,

  layouts: {
    'strip-3': { name: 'Strip 3 Foto', maxPhotos: 3, cols: 1, aspect: '3/4' },
    'strip-4': { name: 'Strip 4 Foto', maxPhotos: 4, cols: 1, aspect: '3/4' },
    'grid-4': { name: 'Grid 4', maxPhotos: 4, cols: 2, aspect: '1/1' },
    'single': { name: 'Single', maxPhotos: 1, cols: 1, aspect: '4/3' }
  },

  init() {
    this.canvas = document.getElementById('editCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.loadPhotosFromSession();
    this.bindEvents();
    this.render();
  },

  loadPhotosFromSession() {
    const photosData = sessionStorage.getItem('photobooth_photos');
    if (photosData) {
      try {
        const data = JSON.parse(photosData);
        this.photos = data.photos || [];
        this.currentLayout = data.layout || 'strip-3';
        this.maxPhotos = this.layouts[this.currentLayout].maxPhotos;
      } catch (e) {
        this.photos = [];
      }
    }
    
    if (this.photos.length === 0) {
      this.photos = [null, null, null];
      this.maxPhotos = 3;
    }
  },

  savePhotosToSession() {
    sessionStorage.setItem('photobooth_photos', JSON.stringify({
      photos: this.photos,
      layout: this.currentLayout
    }));
  },

  bindEvents() {
    document.getElementById('stickerBtn').onclick = () => this.toggleStickerPanel();
    document.getElementById('closeStickerPanel').onclick = () => this.closeStickerPanel();
    document.getElementById('layoutBtn').onclick = () => this.toggleLayoutSelector();
    document.getElementById('retakeAllBtn').onclick = () => this.retakeAll();
    document.getElementById('deleteStickerBtn').onclick = () => this.deleteSelectedSticker();
    document.getElementById('saveEditBtn').onclick = () => this.savePhoto();

    document.querySelectorAll('.sticker-item').forEach(item => {
      item.onclick = () => {
        const emoji = item.dataset.emoji;
        this.addSticker(emoji);
        this.closeStickerPanel();
      };
    });

    document.querySelectorAll('.edit-layout-card').forEach(card => {
      card.onclick = () => this.changeLayout(card.dataset.layout);
    });

    document.getElementById('captureModalBtn').onclick = () => this.capturePhoto();

    document.getElementById('editPhotoArea').addEventListener('click', (e) => {
      if (e.target === this.canvas) {
        this.deselectAllStickers();
      }
    });

    this.setupStickerDrag();
  },

  toggleStickerPanel() {
    const panel = document.getElementById('stickerPanel');
    const selector = document.getElementById('editLayoutSelector');
    selector.classList.remove('open');
    panel.classList.toggle('open');
  },

  closeStickerPanel() {
    document.getElementById('stickerPanel').classList.remove('open');
  },

  toggleLayoutSelector() {
    const panel = document.getElementById('stickerPanel');
    const selector = document.getElementById('editLayoutSelector');
    panel.classList.remove('open');
    selector.classList.toggle('open');
  },

  changeLayout(layout) {
    this.currentLayout = layout;
    this.maxPhotos = this.layouts[layout].maxPhotos;
    
    while (this.photos.length < this.maxPhotos) {
      this.photos.push(null);
    }
    while (this.photos.length > this.maxPhotos) {
      this.photos.pop();
    }

    document.querySelectorAll('.edit-layout-card').forEach(card => {
      card.classList.toggle('selected', card.dataset.layout === layout);
    });

    document.getElementById('editLayoutSelector').classList.remove('open');
    this.savePhotosToSession();
    this.render();
  },

  addSticker(emoji, x = 100, y = 100) {
    const sticker = {
      id: Date.now(),
      emoji,
      x,
      y,
      size: 60,
      rotation: 0,
      selected: false
    };
    this.stickers.push(sticker);
    this.renderSticker(sticker);
  },

  renderSticker(sticker) {
    const layer = document.getElementById('stickerLayer');
    let el = document.getElementById(`sticker-${sticker.id}`);
    
    if (!el) {
      el = document.createElement('div');
      el.id = `sticker-${sticker.id}`;
      el.className = 'sticker-element';
      el.innerHTML = `
        <span style="font-size: ${sticker.size}px">${sticker.emoji}</span>
        <div class="sticker-controls">
          <button class="sticker-control-btn" onclick="EditPage.rotateSticker(${sticker.id})">↻</button>
          <button class="sticker-control-btn" onclick="EditPage.scaleSticker(${sticker.id}, 1.2)">+</button>
          <button class="sticker-control-btn" onclick="EditPage.scaleSticker(${sticker.id}, 0.8)">−</button>
          <button class="sticker-control-btn" onclick="EditPage.deleteSticker(${sticker.id})">×</button>
        </div>
      `;
      layer.appendChild(el);
    }

    el.style.left = sticker.x + 'px';
    el.style.top = sticker.y + 'px';
    el.style.transform = `rotate(${sticker.rotation}deg)`;
    el.classList.toggle('selected', sticker.selected);
  },

  setupStickerDrag() {
    const layer = document.getElementById('stickerLayer');
    let activeSticker = null;
    let offsetX = 0, offsetY = 0;

    const onStart = (e, sticker) => {
      e.preventDefault();
      activeSticker = sticker;
      sticker.selected = true;
      this.deselectAllStickers();
      sticker.selected = true;
      
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      offsetX = clientX - sticker.x;
      offsetY = clientY - sticker.y;
      
      this.renderSticker(sticker);
    };

    const onMove = (e) => {
      if (!activeSticker) return;
      e.preventDefault();
      
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      
      activeSticker.x = clientX - offsetX;
      activeSticker.y = clientY - offsetY;
      this.renderSticker(activeSticker);
    };

    const onEnd = () => {
      activeSticker = null;
    };

    layer.addEventListener('mousedown', (e) => {
      const el = e.target.closest('.sticker-element');
      if (el) {
        const id = parseInt(el.id.replace('sticker-', ''));
        const sticker = this.stickers.find(s => s.id === id);
        if (sticker) onStart(e, sticker);
      }
    });

    layer.addEventListener('touchstart', (e) => {
      const el = e.target.closest('.sticker-element');
      if (el) {
        const id = parseInt(el.id.replace('sticker-', ''));
        const sticker = this.stickers.find(s => s.id === id);
        if (sticker) onStart(e, sticker);
      }
    }, { passive: false });

    document.addEventListener('mousemove', onMove);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('mouseup', onEnd);
    document.addEventListener('touchend', onEnd);
  },

  deselectAllStickers() {
    this.stickers.forEach(s => s.selected = false);
    document.querySelectorAll('.sticker-element').forEach(el => el.classList.remove('selected'));
  },

  rotateSticker(id) {
    const sticker = this.stickers.find(s => s.id === id);
    if (sticker) {
      sticker.rotation = (sticker.rotation + 45) % 360;
      this.renderSticker(sticker);
    }
  },

  scaleSticker(id, factor) {
    const sticker = this.stickers.find(s => s.id === id);
    if (sticker) {
      sticker.size = Math.max(20, Math.min(150, sticker.size * factor));
      this.renderSticker(sticker);
      const el = document.getElementById(`sticker-${id}`);
      if (el) el.querySelector('span').style.fontSize = sticker.size + 'px';
    }
  },

  deleteSticker(id) {
    this.stickers = this.stickers.filter(s => s.id !== id);
    const el = document.getElementById(`sticker-${id}`);
    if (el) el.remove();
  },

  deleteSelectedSticker() {
    const selected = this.stickers.find(s => s.selected);
    if (selected) this.deleteSticker(selected.id);
  },

  async retakeAll() {
    this.photos = new Array(this.maxPhotos).fill(null);
    this.renderSlots();
    await this.openCaptureModal(0);
  },

  async openCaptureModal(slotIndex) {
    this.captureSlotIndex = slotIndex;
    const modal = document.getElementById('captureModal');
    const video = document.getElementById('captureModalVideo');
    
    modal.classList.add('open');
    
    try {
      if (this.stream) {
        this.stream.getTracks().forEach(t => t.stop());
      }
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false
      });
      video.srcObject = this.stream;
      await video.play();
    } catch (err) {
      console.error('Camera error:', err);
      App.showNotification('Gagal akses kamera', 'error');
      this.closeCaptureModal();
    }
  },

  async capturePhoto() {
    if (this.captureSlotIndex === null) return;
    
    const video = document.getElementById('captureModalVideo');
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    
    this.photos[this.captureSlotIndex] = canvas.toDataURL('image/jpeg', 0.9);
    this.closeCaptureModal();
    this.renderSlots();
    this.render();
    this.savePhotosToSession();
  },

  closeCaptureModal() {
    const modal = document.getElementById('captureModal');
    const video = document.getElementById('captureModalVideo');
    
    modal.classList.remove('open');
    if (video.srcObject) {
      video.srcObject.getTracks().forEach(t => t.stop());
      video.srcObject = null;
    }
    
    if (this.captureSlotIndex !== null && this.captureSlotIndex < this.maxPhotos - 1) {
      this.captureSlotIndex++;
      if (!this.photos[this.captureSlotIndex]) {
        setTimeout(() => this.openCaptureModal(this.captureSlotIndex), 500);
      }
    }
    this.captureSlotIndex = null;
  },

  renderSlots() {
    const container = document.getElementById('photoSlots');
    const layout = this.layouts[this.currentLayout];
    
    container.className = `photo-slots layout-${this.currentLayout}`;
    container.innerHTML = '';
    
    this.photos.forEach((photo, i) => {
      const slot = document.createElement('div');
      slot.className = `photo-slot ${photo ? 'captured' : ''}`;
      slot.style.aspectRatio = layout.aspect;
      
      if (photo) {
        slot.innerHTML = `<img src="${photo}" alt="Foto ${i + 1}">`;
      } else {
        slot.innerHTML = `<div class="slot-overlay"><span>📷</span><span>Tap untuk ambil</span></div>`;
      }
      
      slot.onclick = () => this.openCaptureModal(i);
      container.appendChild(slot);
    });
  },

  render() {
    this.renderSlots();
    
    const canvas = this.canvas;
    const ctx = this.ctx;
    const w = canvas.parentElement.clientWidth;
    const layout = this.layouts[this.currentLayout];
    
    let h;
    if (this.currentLayout === 'single') {
      h = w * 0.75;
    } else if (this.currentLayout === 'grid-4') {
      h = w;
    } else {
      h = w * this.photos.filter(p => p).length * 1.33;
    }
    
    canvas.width = w;
    canvas.height = h;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, w, h);
    
    let y = 20;
    this.photos.forEach((photo, i) => {
      if (photo) {
        const img = new Image();
        img.onload = () => {
          const photoH = w * 1.33;
          ctx.drawImage(img, 10, y, w - 20, photoH);
        };
        img.src = photo;
        y += w * 1.33 + 10;
      }
    });
    
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, w, 40);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('My Photobooth', w / 2, 27);
    
    ctx.fillStyle = '#666';
    ctx.font = '10px Arial';
    ctx.fillText(new Date().toLocaleDateString('id-ID'), w / 2, h - 10);
  },

  async savePhoto() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const w = 800;
    const layout = this.layouts[this.currentLayout];
    
    let h;
    if (this.currentLayout === 'single') {
      h = w * 0.75;
    } else if (this.currentLayout === 'grid-4') {
      h = w;
    } else {
      h = w * 1.33 * this.photos.filter(p => p).length + 100;
    }
    
    canvas.width = w;
    canvas.height = h;
    
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, w, h);
    
    let y = 50;
    const photoW = w - 40;
    const photoH = photoW * 1.33;
    
    let loaded = 0;
    const total = this.photos.filter(p => p).length;
    
    this.photos.forEach((photo, i) => {
      if (photo) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 20, y, photoW, photoH);
          y += photoH + 10;
          loaded++;
          if (loaded >= total) {
            ctx.fillStyle = '#1a1a2e';
            ctx.fillRect(0, 0, w, 40);
            ctx.fillStyle = 'white';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('My Photobooth', w / 2, 27);
            
            ctx.fillStyle = '#666';
            ctx.font = '10px Arial';
            ctx.fillText(new Date().toLocaleDateString('id-ID'), w / 2, h - 10);
            
            this.finalizeSave(canvas);
        };
        img.src = photo;
      }
    });
    
    if (total === 0) {
      this.finalizeSave(canvas);
    }
  },

  finalizeSave(canvas) {
    const imgData = canvas.toDataURL('image/jpeg', 0.92);
    App.uploadPhoto(imgData, 'final')
      .then(() => {
        App.showNotification('Foto disimpan!');
        sessionStorage.removeItem('photobooth_photos');
        setTimeout(() => history.back(), 1000);
      })
      .catch(err => {
        App.showNotification('Gagal menyimpan', 'error');
      });
  }
};

document.addEventListener('DOMContentLoaded', () => {
  EditPage.init();
});

window.EditPage = EditPage;