const App = {
  serverIP: localStorage.getItem('photobooth_server_ip') || '',
  serverPort: localStorage.getItem('photobooth_server_port') || '',

  get serverUrl() {
    if (this.serverIP) {
      const port = this.serverPort || (window.location.protocol === 'https:' ? '443' : '80');
      return `${window.location.protocol}//${this.serverIP}:${port}`;
    }
    return window.location.origin;
  },

  init() {
    App.setupSocket();
    App.bindEvents();
  },

  setupSocket() {
    SocketClient.init();
  },

  bindEvents() {},

  async uploadPhoto(imageData, type = 'raw') {
    try {
      const response = await fetch(`${this.serverUrl}/upload-base64`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageData, type })
      });
      if (!response.ok) throw new Error('Upload failed');
      return await response.json();
    } catch (error) {
      console.error('[App] Upload error:', error);
      throw error;
    }
  },

  async getPhotos() {
    try {
      const response = await fetch(`${this.serverUrl}/photos?type=final`);
      const result = await response.json();
      return result.photos || [];
    } catch (error) {
      console.error('[App] Get photos error:', error);
      return [];
    }
  },

  async deletePhoto(filename) {
    try {
      const response = await fetch(`${this.serverUrl}/uploads/final/${filename}`, { method: 'DELETE' });
      return response.ok;
    } catch (error) {
      console.error('[App] Delete error:', error);
      return false;
    }
  },

  showNotification(message, type = 'info') {
    const n = document.createElement('div');
    n.className = 'notification';
    n.textContent = message;
    document.body.appendChild(n);
    setTimeout(() => n.classList.add('show'), 10);
    setTimeout(() => { n.classList.remove('show'); setTimeout(() => n.remove(), 300); }, 3000);
  }
};

App.setupSocket();

const PhotoboothPreview = {
  init() {
    this.bindEvents();
    this.loadSettings();
  },

  loadSettings() {
    const serverIP = document.getElementById('serverIP');
    const serverPort = document.getElementById('serverPort');
    if (serverIP) serverIP.value = App.serverIP;
    if (serverPort) serverPort.value = App.serverPort;
  },

  bindEvents() {
    const captureBtn = document.getElementById('captureBtn');
    const retakeBtn = document.getElementById('retakeBtn');
    const doneBtn = document.getElementById('doneBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const editBtn = document.getElementById('editBtn');
    const fullscreenBtn = document.getElementById('fullscreenBtn');

    if (captureBtn) {
      captureBtn.addEventListener('click', () => {
        if (typeof LayoutManager !== 'undefined') LayoutManager.startCapture();
      });
    }

    if (retakeBtn) {
      retakeBtn.addEventListener('click', () => {
        if (typeof LayoutManager !== 'undefined') LayoutManager.reset();
        captureBtn.disabled = false;
        retakeBtn.disabled = true;
        doneBtn.disabled = true;
        document.getElementById('stripPreview').classList.add('hidden');
      });
    }

    if (doneBtn) {
      doneBtn.addEventListener('click', async () => {
        doneBtn.disabled = true;
        if (typeof LayoutManager !== 'undefined' && LayoutManager.photos.length > 0) {
          const img = await LayoutManager.getFinalImage();
          if (img) {
            await App.uploadPhoto(img, 'final');
            App.showNotification('Foto disimpan!');
            LayoutManager.reset();
            captureBtn.disabled = false;
            retakeBtn.disabled = true;
            doneBtn.disabled = true;
            document.getElementById('stripPreview').classList.add('hidden');
          }
        }
      });
    }

    if (downloadBtn) {
      downloadBtn.addEventListener('click', async () => {
        if (typeof LayoutManager !== 'undefined') await LayoutManager.download();
      });
    }

    if (editBtn) {
      editBtn.addEventListener('click', () => {
        if (typeof LayoutManager !== 'undefined' && LayoutManager.photos.length > 0) {
          sessionStorage.setItem('photobooth_photos', JSON.stringify({
            photos: LayoutManager.photos,
            layout: LayoutManager.currentLayout
          }));
          window.location.href = 'edit.html';
        }
      });
    }

    if (fullscreenBtn) {
      fullscreenBtn.addEventListener('click', () => {
        const box = document.getElementById('previewBox');
        box.classList.toggle('fullscreen');
        fullscreenBtn.textContent = box.classList.contains('fullscreen') ? '✕' : '⛶';
      });
    }

    document.querySelectorAll('.tab').forEach(btn => {
      btn.addEventListener('click', (e) => this.switchTab(e.target));
    });

    document.querySelectorAll('.layout-card').forEach(card => {
      card.addEventListener('click', (e) => {
        document.querySelectorAll('.layout-card').forEach(c => c.classList.remove('selected'));
        e.currentTarget.classList.add('selected');
        if (typeof LayoutManager !== 'undefined') {
          LayoutManager.selectLayout(e.currentTarget.dataset.layout);
        }
      });
    });

    document.querySelectorAll('.frame-card').forEach(card => {
      card.addEventListener('click', (e) => {
        document.querySelectorAll('.frame-card').forEach(c => c.classList.remove('selected'));
        e.currentTarget.classList.add('selected');
      });
    });
  },

  switchTab(btn) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    const tab = document.getElementById(btn.dataset.tab + 'Tab');
    if (tab) tab.classList.add('active');
    if (btn.dataset.tab === 'gallery') this.loadGallery();
  },

  async loadGallery() {
    const grid = document.getElementById('galleryGrid');
    if (!grid) return;
    const photos = await App.getPhotos();
    grid.innerHTML = '';
    if (photos.length === 0) {
      grid.innerHTML = '<p class="empty-state">Belum ada foto</p>';
      return;
    }
    photos.forEach(p => {
      const div = document.createElement('div');
      div.className = 'gallery-item';
      div.innerHTML = `<img src="${p.url}" alt="Photo"><button class="delete-btn">×</button>`;
      div.querySelector('.delete-btn').onclick = async () => {
        if (confirm('Hapus?')) {
          await App.deletePhoto(p.filename);
          div.remove();
        }
      };
      grid.appendChild(div);
    });
  }
};

document.addEventListener('DOMContentLoaded', () => {
  App.init();
  if (document.getElementById('streamVideo')) {
    PhotoboothPreview.init();
    if (typeof LayoutManager !== 'undefined') LayoutManager.init();
  }
});

window.App = App;
window.PhotoboothPreview = PhotoboothPreview;