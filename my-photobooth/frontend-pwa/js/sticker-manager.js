const StickerManager = {
  stickers: [],
  previewImage: null,

  init() {
    this.bindEvents();
  },

  bindEvents() {
    const stickerGrid = document.getElementById('previewStickerGrid');
    if (stickerGrid) {
      stickerGrid.querySelectorAll('.sticker-item').forEach(item => {
        item.addEventListener('click', () => {
          this.addSticker(item.dataset.emoji);
        });
      });
    }

    this.setupDrag();
  },

  addSticker(emoji, x = null, y = null) {
    const layer = document.getElementById('previewStickerLayer');
    if (!layer) return;

    const id = Date.now();
    const size = 40 + Math.random() * 20;

    const sticker = {
      id,
      emoji,
      x: x || (50 + Math.random() * 30),
      y: y || (50 + Math.random() * 30),
      size,
      rotation: Math.random() * 30 - 15,
      selected: false
    };

    this.stickers.push(sticker);
    this.renderSticker(sticker);
    this.updateStickerList();
  },

  renderSticker(sticker) {
    const layer = document.getElementById('previewStickerLayer');
    let el = document.getElementById(`preview-sticker-${sticker.id}`);

    if (!el) {
      el = document.createElement('div');
      el.id = `preview-sticker-${sticker.id}`;
      el.className = 'sticker-element';
      el.innerHTML = `
        <span style="font-size: ${sticker.size}px">${sticker.emoji}</span>
        <div class="sticker-controls">
          <button class="sticker-control-btn" onclick="StickerManager.rotateSticker(${sticker.id})">↻</button>
          <button class="sticker-control-btn" onclick="StickerManager.scaleSticker(${sticker.id}, 1.2)">+</button>
          <button class="sticker-control-btn" onclick="StickerManager.scaleSticker(${sticker.id}, 0.8)">−</button>
          <button class="sticker-control-btn" onclick="StickerManager.deleteSticker(${sticker.id})">×</button>
        </div>
      `;
      layer.appendChild(el);
    }

    el.style.left = sticker.x + '%';
    el.style.top = sticker.y + '%';
    el.style.transform = `translate(-50%, -50%) rotate(${sticker.rotation}deg)`;
    el.classList.toggle('selected', sticker.selected);
  },

  setupDrag() {
    const layer = document.getElementById('previewStickerLayer');
    if (!layer) return;

    let activeSticker = null;
    let offsetX = 0, offsetY = 0;

    const getPos = (e) => {
      const rect = layer.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: ((clientX - rect.left) / rect.width) * 100,
        y: ((clientY - rect.top) / rect.height) * 100
      };
    };

    const onStart = (e, sticker) => {
      e.preventDefault();
      e.stopPropagation();
      activeSticker = sticker;
      this.deselectAll();
      sticker.selected = true;
      const pos = getPos(e);
      offsetX = sticker.x - pos.x;
      offsetY = sticker.y - pos.y;
      this.renderSticker(sticker);
    };

    const onMove = (e) => {
      if (!activeSticker) return;
      e.preventDefault();
      e.stopPropagation();
      const pos = getPos(e);
      activeSticker.x = pos.x + offsetX;
      activeSticker.y = pos.y + offsetY;
      this.renderSticker(activeSticker);
    };

    const onEnd = () => {
      activeSticker = null;
    };

    layer.addEventListener('mousedown', (e) => {
      const el = e.target.closest('.sticker-element');
      if (el) {
        const id = parseInt(el.id.replace('preview-sticker-', ''));
        const sticker = this.stickers.find(s => s.id === id);
        if (sticker) onStart(e, sticker);
      }
    });

    layer.addEventListener('touchstart', (e) => {
      const el = e.target.closest('.sticker-element');
      if (el) {
        const id = parseInt(el.id.replace('preview-sticker-', ''));
        const sticker = this.stickers.find(s => s.id === id);
        if (sticker) onStart(e, sticker);
      }
    }, { passive: false });

    document.addEventListener('mousemove', onMove);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('mouseup', onEnd);
    document.addEventListener('touchend', onEnd);
  },

  deselectAll() {
    this.stickers.forEach(s => s.selected = false);
    document.querySelectorAll('#previewStickerLayer .sticker-element').forEach(el => el.classList.remove('selected'));
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
      sticker.size = Math.max(20, Math.min(100, sticker.size * factor));
      this.renderSticker(sticker);
      const el = document.getElementById(`preview-sticker-${id}`);
      if (el) el.querySelector('span').style.fontSize = sticker.size + 'px';
    }
  },

  deleteSticker(id) {
    this.stickers = this.stickers.filter(s => s.id !== id);
    const el = document.getElementById(`preview-sticker-${id}`);
    if (el) el.remove();
    this.updateStickerList();
  },

  updateStickerList() {
    const list = document.getElementById('addedStickersList');
    if (!list) return;

    if (this.stickers.length === 0) {
      list.innerHTML = '<p class="empty-state">Belum ada stiker</p>';
    } else {
      list.innerHTML = this.stickers.map(s => `
        <div class="sticker-item-mini" onclick="StickerManager.selectSticker(${s.id})">
          <span>${s.emoji}</span>
        </div>
      `).join('');
    }
  },

  selectSticker(id) {
    const sticker = this.stickers.find(s => s.id === id);
    if (sticker) {
      this.deselectAll();
      sticker.selected = true;
      this.renderSticker(sticker);
    }
  },

  getStickersData() {
    return this.stickers.map(s => ({
      emoji: s.emoji,
      x: s.x,
      y: s.y,
      size: s.size,
      rotation: s.rotation
    }));
  },

  reset() {
    this.stickers = [];
    const layer = document.getElementById('previewStickerLayer');
    if (layer) layer.innerHTML = '';
    this.updateStickerList();
  }
};

window.StickerManager = StickerManager;