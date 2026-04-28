const LayoutManager = {
  currentLayout: 'strip-3',
  photos: [],
  maxPhotos: 3,
  isCapturing: false,

  layouts: {
    'strip-3': { name: 'Strip 3 Foto', maxPhotos: 3, cols: 1 },
    'strip-4': { name: 'Strip 4 Foto', maxPhotos: 4, cols: 1 },
    'grid-4': { name: 'Grid 4', maxPhotos: 4, cols: 2 },
    'single': { name: 'Single', maxPhotos: 1, cols: 1 }
  },

  init() {
    this.bindEvents();
    this.updateCounter();
  },

  bindEvents() {
    const captureBtn = document.getElementById('captureBtn');
    if (captureBtn) {
      captureBtn.addEventListener('click', () => this.startCapture());
    }
  },

  selectLayout(id) {
    this.currentLayout = id;
    this.maxPhotos = this.layouts[id].maxPhotos;
    this.photos = [];
    this.updateCounter();
    this.updatePreview();
    App.showNotification('Layout: ' + this.layouts[id].name, 'info');
  },

  async startCapture() {
    if (this.isCapturing) return;
    if (this.photos.length >= this.maxPhotos) {
      App.showNotification('Foto sudah penuh', 'info');
      return;
    }

    this.isCapturing = true;
    this.updateCounter();
    await this.showCountdown();
    SocketClient.emit('take_photo');
  },

  async showCountdown() {
    return new Promise((resolve) => {
      const counter = document.getElementById('captureCounter');
      if (!counter) return resolve();

      let count = 3;
      const updateCountdown = () => {
        if (count > 0) {
          counter.innerHTML = `<div class="countdown-number">${count}</div>`;
          count--;
          setTimeout(updateCountdown, 1000);
        } else {
          counter.innerHTML = '';
          resolve();
        }
      };
      updateCountdown();
    });
  },

  onPhotoTaken(imageData) {
    this.photos.push(imageData);
    this.isCapturing = false;
    this.updateCounter();
    this.updatePreview();
    
    if (this.photos.length >= this.maxPhotos) {
      this.onCaptureComplete();
    }
  },

  updateCounter() {
    const counter = document.getElementById('captureCounter');
    if (!counter) return;

    let html = '';
    for (let i = 0; i < this.maxPhotos; i++) {
      const active = i === this.photos.length && this.isCapturing;
      const completed = i < this.photos.length;
      html += `<div class="counter-dot ${active ? 'active' : ''} ${completed ? 'completed' : ''}"></div>`;
    }
    counter.innerHTML = html;
    
    const captureBtn = document.getElementById('captureBtn');
    if (captureBtn) {
      captureBtn.disabled = this.photos.length >= this.maxPhotos;
    }
  },

  updatePreview() {
    const container = document.getElementById('stripPreview');
    const photosDiv = document.getElementById('stripPhotos');
    const dateDiv = document.getElementById('stripDate');
    
    if (!container || !photosDiv) return;

    if (this.photos.length === 0) {
      container.classList.add('hidden');
      container.className = 'strip-preview hidden';
      return;
    }

    container.classList.remove('hidden');
    container.className = `strip-preview layout-${this.currentLayout}`;
    
    photosDiv.innerHTML = this.photos.map((img, i) => `<img src="${img}" alt="Foto ${i + 1}">`).join('');
    
    if (dateDiv) {
      dateDiv.textContent = new Date().toLocaleDateString('id-ID');
    }
  },

  onCaptureComplete() {
    App.showNotification('Semua foto diambil!', 'success');
  },

  reset() {
    this.photos = [];
    this.isCapturing = false;
    this.updateCounter();
    this.updatePreview();
  },

  async getFinalImage() {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      const w = 800;
      const pad = 20;
      const headerH = 50;
      const footerH = 30;
      let contentH, photoW, photoH;
      
      if (this.currentLayout === 'strip-3' || this.currentLayout === 'strip-4') {
        contentH = w * 3;
        canvas.width = w;
        canvas.height = w + headerH + footerH + (contentH - w) + pad * 4;
        photoW = w - pad * 2;
        photoH = photoW * 4 / 3;
      } else if (this.currentLayout === 'grid-4') {
        const cellW = (w - pad * 3) / 2;
        contentH = cellW * 2 + pad;
        canvas.width = w;
        canvas.height = headerH + contentH + footerH + pad * 2;
        photoW = cellW;
        photoH = cellW;
      } else {
        canvas.width = w;
        canvas.height = w * 3 / 4 + headerH + footerH + pad * 2;
        photoW = w - pad * 2;
        photoH = photoW * 3 / 4;
      }
      
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(pad, pad, canvas.width - pad * 2, headerH);
      ctx.fillStyle = 'white';
      ctx.font = 'bold 18px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('My Photobooth', canvas.width / 2, pad + headerH / 2 + 6);
      
      ctx.fillStyle = '#666';
      ctx.font = '12px Arial';
      ctx.fillText(new Date().toLocaleDateString('id-ID'), canvas.width / 2, canvas.height - pad - 10);

      let loaded = 0;
      const total = this.photos.length;
      const filter = typeof FilterManager !== 'undefined' ? FilterManager.getFilterStyle() : '';
      const stickers = typeof StickerManager !== 'undefined' ? StickerManager.getStickersData() : [];
      
      const drawAll = () => {
        loaded++;
        if (loaded >= total) {
          this.drawStickers(ctx, canvas.width, canvas.height, stickers);
          resolve(canvas.toDataURL('image/jpeg', 0.92));
        }
      };
      
      const drawPhoto = (img, x, y, w, h) => {
        if (filter) {
          ctx.filter = filter;
        }
        ctx.drawImage(img, x, y, w, h);
        ctx.filter = 'none';
      };
      
      if (this.currentLayout === 'strip-3' || this.currentLayout === 'strip-4') {
        this.photos.forEach((photo, i) => {
          const img = new Image();
          img.onload = () => {
            const y = pad * 2 + headerH + i * (photoH + pad);
            drawPhoto(img, pad, y, photoW, photoH);
            drawAll();
          };
          img.onerror = () => drawAll();
          img.src = photo;
        });
      } else if (this.currentLayout === 'grid-4') {
        this.photos.forEach((photo, i) => {
          const col = i % 2;
          const row = Math.floor(i / 2);
          const x = pad + col * (photoW + pad);
          const y = pad * 2 + headerH + row * (photoH + pad);
          
          const img = new Image();
          img.onload = () => {
            drawPhoto(img, x, y, photoW, photoH);
            drawAll();
          };
          img.onerror = () => drawAll();
          img.src = photo;
        });
      } else {
        if (this.photos[0]) {
          const img = new Image();
          img.onload = () => {
            const y = pad * 2 + headerH;
            drawPhoto(img, pad, y, photoW, photoH);
            drawAll();
          };
          img.onerror = () => drawAll();
          img.src = this.photos[0];
        } else {
          resolve(canvas.toDataURL('image/jpeg', 0.92));
        }
      }
    });
  },

  drawStickers(ctx, w, h, stickers) {
    stickers.forEach(s => {
      const x = (s.x / 100) * w;
      const y = (s.y / 100) * h;
      const size = (s.size / 100) * Math.min(w, h) * 0.5;
      
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((s.rotation * Math.PI) / 180);
      ctx.font = `${size}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(s.emoji, 0, 0);
      ctx.restore();
    });
  },

  async download() {
    const imageData = await this.getFinalImage();
    const link = document.createElement('a');
    link.download = `photobooth_${Date.now()}.jpg`;
    link.href = imageData;
    link.click();
    App.showNotification('Foto didownload!', 'success');
  },

  async print() {
    const imageData = await this.getFinalImage();
    const win = window.open('', '_blank');
    win.document.write('<img src="' + imageData + '" style="max-width:100%; height:auto;"/>');
    win.document.write('<script>window.onload = function() { setTimeout(function() { window.print(); window.close(); }, 500); }</script>');
    win.document.close();
  },

  async saveToServer() {
    const imageData = await this.getFinalImage();
    await App.uploadPhoto(imageData, 'final');
    App.showNotification('Foto disimpan!', 'success');
  }
};

window.LayoutManager = LayoutManager;