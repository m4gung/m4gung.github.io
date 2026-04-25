const PhotoEditor = {
  canvas: null,
  ctx: null,
  originalImage: null,
  currentImage: null,
  currentFrame: null,
  frameImage: null,
  rotation: 0,
  flipH: false,
  flipV: false,
  grayscale: false,

  frames: {
    none: null,
    classic: null,
    modern: null,
    festive: null
  },

  init() {
    this.canvas = document.getElementById('previewCanvas');
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    this.loadFrames();
    this.bindEvents();
  },

  async loadFrames() {
    const framePaths = {
      classic: 'assets/frame-classic.png',
      modern: 'assets/frame-modern.png',
      festive: 'assets/frame-festive.png'
    };

    for (const [name, path] of Object.entries(framePaths)) {
      try {
        this.frames[name] = await this.loadImage(path);
      } catch (error) {
        console.warn(`Failed to load frame: ${name}`);
      }
    }
  },

  loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  },

  bindEvents() {
    App.socket?.on('camera_stream_update', (data) => {
      if (data.image) {
        this.updatePreview(data.image);
      }
    });

    App.socket?.on('preview_photo_update', (data) => {
      if (data.image) {
        this.setImage(data.image);
      }
    });

    App.socket?.on('photo_ready_response', (data) => {
      if (data.image) {
        this.setImage(data.image);
      }
    });
  },

  async updatePreview(imageData) {
    const previewOverlay = document.getElementById('previewOverlay');
    const previewStatus = document.getElementById('previewStatus');
    const previewStatusText = document.getElementById('previewStatusText');
    const captureBtn = document.getElementById('captureBtn');

    if (previewOverlay) previewOverlay.classList.add('hidden');
    if (previewStatus) previewStatus.className = 'status-dot online';
    if (previewStatusText) previewStatusText.textContent = 'Video stream aktif';
    if (captureBtn) captureBtn.disabled = false;

    try {
      const img = await this.loadImage(imageData);
      this.canvas.width = img.width;
      this.canvas.height = img.height;
      this.ctx.drawImage(img, 0, 0);
    } catch (error) {
      console.error('Failed to update preview:', error);
    }
  },

  async setImage(imageData) {
    try {
      this.originalImage = await this.loadImage(imageData);
      this.currentImage = imageData;
      this.rotation = 0;
      this.flipH = false;
      this.flipV = false;
      this.grayscale = false;

      this.canvas.width = this.originalImage.width;
      this.canvas.height = this.originalImage.height;
      this.render();

      const captureBtn = document.getElementById('captureBtn');
      const retakeBtn = document.getElementById('retakeBtn');
      const doneBtn = document.getElementById('doneBtn');

      if (captureBtn) captureBtn.disabled = false;
      if (retakeBtn) retakeBtn.disabled = false;
      if (doneBtn) doneBtn.disabled = false;

      App.showNotification('Foto diterima!', 'success');
    } catch (error) {
      console.error('Failed to set image:', error);
      App.showNotification('Gagal memproses foto', 'error');
    }
  },

  setFrame(frameName) {
    if (frameName === 'none') {
      this.currentFrame = null;
    } else if (this.frames[frameName]) {
      this.currentFrame = this.frames[frameName];
    }
    this.render();
  },

  applyTool(tool) {
    switch (tool) {
      case 'rotate':
        this.rotation = (this.rotation + 90) % 360;
        break;
      case 'flipH':
        this.flipH = !this.flipH;
        break;
      case 'flipV':
        this.flipV = !this.flipV;
        break;
      case 'grayscale':
        this.grayscale = !this.grayscale;
        break;
    }
    this.render();
  },

  render() {
    if (!this.originalImage) return;

    this.ctx.save();

    const width = this.canvas.width;
    const height = this.canvas.height;

    if (this.rotation === 90 || this.rotation === 270) {
      this.canvas.width = height;
      this.canvas.height = width;
    } else {
      this.canvas.width = this.originalImage.width;
      this.canvas.height = this.originalImage.height;
    }

    this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
    this.ctx.rotate((this.rotation * Math.PI) / 180);
    this.ctx.scale(this.flipH ? -1 : 1, this.flipV ? -1 : 1);

    const drawWidth = this.originalImage.width;
    const drawHeight = this.originalImage.height;

    if (this.rotation === 90 || this.rotation === 270) {
      this.ctx.drawImage(this.originalImage, -drawHeight / 2, -drawWidth / 2, drawHeight, drawWidth);
    } else {
      this.ctx.drawImage(this.originalImage, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
    }

    this.ctx.restore();

    if (this.grayscale) {
      this.applyGrayscale();
    }

    if (this.currentFrame) {
      this.renderFrame();
    }
  },

  applyGrayscale() {
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
      data[i] = avg;
      data[i + 1] = avg;
      data[i + 2] = avg;
    }

    this.ctx.putImageData(imageData, 0, 0);
  },

  renderFrame() {
    if (!this.currentFrame) return;

    const frameAspect = this.currentFrame.width / this.currentFrame.height;
    const canvasAspect = this.canvas.width / this.canvas.height;

    let frameWidth, frameHeight, offsetX, offsetY;

    if (frameAspect > canvasAspect) {
      frameWidth = this.canvas.width;
      frameHeight = this.canvas.width / frameAspect;
      offsetX = 0;
      offsetY = (this.canvas.height - frameHeight) / 2;
    } else {
      frameHeight = this.canvas.height;
      frameWidth = this.canvas.height * frameAspect;
      offsetX = (this.canvas.width - frameWidth) / 2;
      offsetY = 0;
    }

    this.ctx.drawImage(this.currentFrame, offsetX, offsetY, frameWidth, frameHeight);
  },

  getFinalImage() {
    this.render();
    return this.canvas.toDataURL('image/png', 1.0);
  },

  getCompressedImage(quality = 0.8) {
    this.render();
    return this.canvas.toDataURL('image/jpeg', quality);
  },

  downloadImage() {
    const link = document.createElement('a');
    link.download = `photobooth_${Date.now()}.png`;
    link.href = this.canvas.toDataURL('image/png');
    link.click();
  },

  addToGallery(photoData) {
    const galleryGrid = document.getElementById('galleryGrid');
    if (!galleryGrid) return;

    const emptyState = galleryGrid.querySelector('.empty-state');
    if (emptyState) emptyState.remove();

    const photoItem = document.createElement('div');
    photoItem.className = 'gallery-item';
    photoItem.innerHTML = `
      <img src="${photoData.url}" alt="Photo">
      <button class="delete-btn" data-filename="${photoData.filename}">×</button>
    `;

    photoItem.querySelector('.delete-btn').addEventListener('click', async (e) => {
      const filename = e.currentTarget.dataset.filename;
      if (confirm('Hapus foto ini?')) {
        const success = await App.deletePhoto(filename);
        if (success) {
          photoItem.remove();
          App.showNotification('Foto dihapus', 'success');
        }
      }
    });

    galleryGrid.insertBefore(photoItem, galleryGrid.firstChild);
  },

  clear() {
    this.originalImage = null;
    this.currentImage = null;
    this.currentFrame = null;
    this.rotation = 0;
    this.flipH = false;
    this.flipV = false;
    this.grayscale = false;

    if (this.ctx) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }
};

window.PhotoEditor = PhotoEditor;