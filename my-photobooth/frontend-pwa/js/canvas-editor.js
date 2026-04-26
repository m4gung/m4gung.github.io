const CanvasEditor = {
  canvas: null,
  ctx: null,
  originalImage: null,
  currentFrame: null,
  frames: {},

  get isPreview() {
    return window.location.pathname.includes('preview.html');
  },

  init() {
    if (!this.isPreview) return;

    this.canvas = document.getElementById('previewCanvas');
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    this.loadFrames();
  },

  async loadFrames() {
    const framePaths = {
      classic: 'assets/frame-classic.svg',
      modern: 'assets/frame-modern.svg',
      festive: 'assets/frame-festive.svg'
    };

    for (const [name, path] of Object.entries(framePaths)) {
      try {
        this.frames[name] = await this.loadImage(path);
      } catch (error) {
        console.warn(`Failed to load frame: ${name}`, error);
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

  async setImage(imageData) {
    try {
      this.originalImage = await this.loadImage(imageData);
      this.canvas.width = this.originalImage.width;
      this.canvas.height = this.originalImage.height;
      this.render();

      const captureBtn = document.getElementById('captureBtn');
      const retakeBtn = document.getElementById('retakeBtn');
      const doneBtn = document.getElementById('doneBtn');

      if (captureBtn) captureBtn.disabled = false;
      if (retakeBtn) retakeBtn.disabled = false;
      if (doneBtn) doneBtn.disabled = false;
    } catch (error) {
      console.error('[Canvas] Failed to set image:', error);
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
    console.log('[Canvas] Apply tool:', tool);
  },

  render() {
    if (!this.originalImage) return;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.drawImage(this.originalImage, 0, 0);

    if (this.currentFrame) {
      const frameAspect = this.currentFrame.width / this.currentFrame.height;
      const canvasAspect = this.canvas.width / this.canvas.height;

      let fw, fh, fx, fy;

      if (frameAspect > canvasAspect) {
        fw = this.canvas.width;
        fh = this.canvas.width / frameAspect;
        fx = 0;
        fy = (this.canvas.height - fh) / 2;
      } else {
        fh = this.canvas.height;
        fw = this.canvas.height * frameAspect;
        fy = 0;
        fx = (this.canvas.width - fw) / 2;
      }

      this.ctx.drawImage(this.currentFrame, fx, fy, fw, fh);
    }
  },

  getFinalImage() {
    this.render();
    return this.canvas.toDataURL('image/png', 1.0);
  },

  getCompressedImage(quality = 0.8) {
    this.render();
    return this.canvas.toDataURL('image/jpeg', quality);
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
    this.currentFrame = null;

    if (this.ctx) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }
};

window.CanvasEditor = CanvasEditor;