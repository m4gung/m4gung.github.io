const App = {
  serverIP: localStorage.getItem('photobooth_server_ip') || 'localhost',
  serverPort: localStorage.getItem('photobooth_server_port') || '3000',
  socket: null,
  isConnected: false,

  get serverUrl() {
    const port = this.serverPort || '3000';
    return `http://${this.serverIP}:${port}`;
  },

  init() {
    this.setupSocket();
    this.updateLocalIP();
    this.bindEvents();
  },

  setupSocket() {
    if (this.socket) {
      this.socket.disconnect();
    }

    this.socket = io(this.serverUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    this.socket.on('connect', () => {
      console.log('Connected to server:', this.socket.id);
      this.isConnected = true;
      this.updateConnectionStatus(true);
      this.socket.emit('register', { deviceType: this.getDeviceType() });
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
      this.isConnected = false;
      this.updateConnectionStatus(false);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      this.isConnected = false;
      this.updateConnectionStatus(false, error.message);
    });

    this.socket.on('photo_request', () => {
      if (typeof PhotoboothCamera !== 'undefined') {
        PhotoboothCamera.capturePhoto();
      }
    });

    this.socket.on('photo_saved', (data) => {
      this.handlePhotoSaved(data);
    });

    this.socket.on('device_registered', (data) => {
      console.log('Devices registered:', data);
    });
  },

  getDeviceType() {
    const path = window.location.pathname;
    if (path.includes('camera.html')) return 'camera';
    if (path.includes('preview.html')) return 'preview';
    return 'unknown';
  },

  updateLocalIP() {
    const ipElement = document.getElementById('localIP');
    if (ipElement) {
      ipElement.textContent = this.serverUrl;
    }
  },

  updateConnectionStatus(connected, message = '') {
    const statusDot = document.querySelector('.status-dot');
    const statusText = document.querySelector('#connectionText, #cameraStatusText, #previewStatusText');
    const serverInfo = document.getElementById('serverInfo');
    const serverUrl = document.getElementById('serverUrl');

    if (statusDot) {
      statusDot.className = `status-dot ${connected ? 'online' : 'offline'}`;
    }

    if (statusText) {
      statusText.textContent = connected ? 'Terhubung ke server' : (message || 'Terputus dari server');
    }

    if (serverInfo && serverUrl) {
      serverInfo.classList.remove('hidden');
      serverUrl.textContent = this.serverUrl;
    }
  },

  bindEvents() {
    document.querySelectorAll('a[href^="camera"], a[href^="preview"]').forEach(link => {
      link.addEventListener('click', (e) => {
        const targetIP = localStorage.getItem('photobooth_server_ip');
        const targetPort = localStorage.getItem('photobooth_server_port');
        if (targetIP && targetPort) {
          const url = new URL(link.href, window.location.origin);
          url.hostname = targetIP;
          url.port = targetPort;
          e.currentTarget.href = url.toString();
        }
      });
    });
  },

  handlePhotoSaved(data) {
    console.log('Photo saved:', data);
    
    if (typeof PhotoEditor !== 'undefined' && data.type === 'final') {
      PhotoEditor.addToGallery(data);
    }
  },

  async uploadPhoto(imageData, type = 'raw') {
    try {
      const response = await fetch(`${this.serverUrl}/upload-base64`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          image: imageData,
          type: type
        })
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      console.log('Upload successful:', result);
      return result;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  },

  async getPhotos() {
    try {
      const response = await fetch(`${this.serverUrl}/photos`);
      const result = await response.json();
      return result.photos || [];
    } catch (error) {
      console.error('Get photos error:', error);
      return [];
    }
  },

  async deletePhoto(filename) {
    try {
      const response = await fetch(`${this.serverUrl}/uploads/${filename}`, {
        method: 'DELETE'
      });
      return response.ok;
    } catch (error) {
      console.error('Delete photo error:', error);
      return false;
    }
  },

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add('show');
    }, 10);

    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, 3000);
  }
};

const PhotoboothCamera = {
  videoElement: null,
  canvasElement: null,
  stream: null,
  currentDeviceId: null,
  devices: [],

  init() {
    this.videoElement = document.getElementById('cameraVideo');
    this.canvasElement = document.getElementById('captureCanvas');

    if (!this.videoElement) return;

    this.bindEvents();
    this.checkCameraAccess();
  },

  async checkCameraAccess() {
    const overlay = document.getElementById('cameraOverlay');
    const statusDot = document.getElementById('cameraStatus');
    const statusText = document.getElementById('cameraStatusText');

    try {
      const testStream = await navigator.mediaDevices.getUserMedia({ video: true });
      testStream.getTracks().forEach(track => track.stop());
      
      if (overlay) overlay.classList.add('hidden');
      if (statusDot) {
        statusDot.className = 'status-dot online';
        statusText.textContent = 'Kamera siap';
      }
      
      this.loadCameras();
    } catch (error) {
      console.error('Camera access error:', error);
      if (statusDot) {
        statusDot.className = 'status-dot offline';
        statusText.textContent = 'Kamera tidak tersedia';
      }
    }
  },

  async loadCameras() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      this.devices = devices.filter(device => device.kind === 'videoinput');
      
      const cameraSelect = document.getElementById('cameraSelect');
      if (cameraSelect && this.devices.length > 0) {
        cameraSelect.innerHTML = this.devices.map(device => 
          `<option value="${device.deviceId}">${device.label || `Kamera ${this.devices.indexOf(device) + 1}`}</option>`
        ).join('');
        
        if (this.devices.length === 1) {
          cameraSelect.classList.add('hidden');
        }
      }
    } catch (error) {
      console.error('Load cameras error:', error);
    }
  },

  async startCamera(deviceId = null) {
    const overlay = document.getElementById('cameraOverlay');
    const statusText = document.getElementById('cameraStatusText');

    try {
      const constraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      };

      if (deviceId) {
        constraints.video.deviceId = { exact: deviceId };
      }

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.videoElement.srcObject = this.stream;
      
      if (overlay) overlay.classList.add('hidden');
      if (statusText) statusText.textContent = 'Kamera aktif - Siap jepret!';

      App.socket?.emit('camera_ready', { deviceId: deviceId || 'default' });

      return true;
    } catch (error) {
      console.error('Start camera error:', error);
      if (statusText) statusText.textContent = 'Gagal mengakses kamera';
      return false;
    }
  },

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
  },

  async capturePhoto() {
    if (!this.videoElement || !this.stream) {
      console.error('Camera not started');
      return null;
    }

    const canvas = this.canvasElement || document.createElement('canvas');
    canvas.width = this.videoElement.videoWidth;
    canvas.height = this.videoElement.videoHeight;

    const context = canvas.getContext('2d');
    context.drawImage(this.videoElement, 0, 0);

    const dataUrl = canvas.toDataURL('image/png', 1.0);

    App.socket?.emit('photo_ready', { 
      timestamp: Date.now(),
      hasImage: true
    });

    App.socket?.emit('camera_stream', {
      image: dataUrl
    });

    return dataUrl;
  },

  bindEvents() {
    const cameraSelect = document.getElementById('cameraSelect');
    const resolutionSelect = document.getElementById('resolutionSelect');
    const requestCameraBtn = document.getElementById('requestCameraBtn');

    if (requestCameraBtn) {
      requestCameraBtn.addEventListener('click', () => this.startCamera());
    }

    if (cameraSelect) {
      cameraSelect.addEventListener('change', (e) => {
        this.startCamera(e.target.value);
      });
    }

    if (resolutionSelect) {
      resolutionSelect.addEventListener('change', (e) => {
        const [width, height] = e.target.value.split('x').map(Number);
        this.startCamera(this.currentDeviceId);
      });
    }
  }
};

const PhotoboothPreview = {
  videoElement: null,
  canvasElement: null,
  stream: null,
  currentPhoto: null,
  photos: [],

  init() {
    this.videoElement = document.getElementById('streamVideo');
    this.canvasElement = document.getElementById('previewCanvas');

    if (!this.videoElement) return;

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
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');

    if (captureBtn) {
      captureBtn.addEventListener('click', () => this.capturePhoto());
    }

    if (retakeBtn) {
      retakeBtn.addEventListener('click', () => this.retakePhoto());
    }

    if (doneBtn) {
      doneBtn.addEventListener('click', () => this.finishPhoto());
    }

    if (saveSettingsBtn) {
      saveSettingsBtn.addEventListener('click', () => this.saveSettings());
    }

    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.switchTab(e.target));
    });

    document.querySelectorAll('.frame-item').forEach(item => {
      item.addEventListener('click', (e) => this.selectFrame(e.currentTarget));
    });

    document.querySelectorAll('.tool-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.applyTool(e.currentTarget.dataset.tool));
    });
  },

  switchTab(button) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    button.classList.add('active');
    
    const tabId = button.dataset.tab + 'Tab';
    const tabContent = document.getElementById(tabId);
    if (tabContent) tabContent.classList.add('active');
  },

  capturePhoto() {
    App.socket?.emit('take_photo');
    
    const captureBtn = document.getElementById('captureBtn');
    if (captureBtn) {
      captureBtn.classList.add('capturing');
      captureBtn.disabled = true;
      
      setTimeout(() => {
        captureBtn.classList.remove('capturing');
        captureBtn.disabled = false;
      }, 2000);
    }

    App.showNotification('Meminta foto...', 'info');
  },

  retakePhoto() {
    this.currentPhoto = null;
    this.updatePhotoDisplay(null);
    
    const retakeBtn = document.getElementById('retakeBtn');
    const doneBtn = document.getElementById('doneBtn');
    
    if (retakeBtn) retakeBtn.disabled = true;
    if (doneBtn) doneBtn.disabled = true;
    
    App.showNotification('Ambil ulang', 'info');
  },

  async finishPhoto() {
    if (!this.currentPhoto) return;

    const doneBtn = document.getElementById('doneBtn');
    if (doneBtn) doneBtn.disabled = true;

    try {
      await App.uploadPhoto(this.currentPhoto, 'final');
      App.showNotification('Foto disimpan!', 'success');
      
      this.currentPhoto = null;
      this.updatePhotoDisplay(null);
    } catch (error) {
      App.showNotification('Gagal menyimpan foto', 'error');
    }

    if (doneBtn) doneBtn.disabled = false;
  },

  updatePhotoDisplay(photoData) {
    const thumbnail = document.getElementById('photoThumbnail');
    const placeholder = document.getElementById('photoPlaceholder');

    if (photoData) {
      if (thumbnail) {
        thumbnail.src = photoData;
        thumbnail.classList.remove('hidden');
      }
      if (placeholder) {
        placeholder.classList.add('hidden');
      }
    } else {
      if (thumbnail) {
        thumbnail.classList.add('hidden');
      }
      if (placeholder) {
        placeholder.classList.remove('hidden');
      }
    }
  },

  selectFrame(frameItem) {
    document.querySelectorAll('.frame-item').forEach(item => {
      item.classList.remove('selected');
    });
    frameItem.classList.add('selected');
    
    const frameName = frameItem.dataset.frame;
    if (typeof PhotoEditor !== 'undefined') {
      PhotoEditor.setFrame(frameName);
    }
  },

  applyTool(tool) {
    if (typeof PhotoEditor !== 'undefined') {
      PhotoEditor.applyTool(tool);
    }
  },

  saveSettings() {
    const serverIP = document.getElementById('serverIP');
    const serverPort = document.getElementById('serverPort');

    if (serverIP) {
      localStorage.setItem('photobooth_server_ip', serverIP.value);
      App.serverIP = serverIP.value;
    }
    if (serverPort) {
      localStorage.setItem('photobooth_server_port', serverPort.value);
      App.serverPort = serverPort.value;
    }

    App.setupSocket();
    App.showNotification('Pengaturan disimpan', 'success');
  },

  updateStream(imageData) {
    if (!this.videoElement) return;
    
    const previewOverlay = document.getElementById('previewOverlay');
    const previewStatus = document.getElementById('previewStatus');
    const previewStatusText = document.getElementById('previewStatusText');
    const captureBtn = document.getElementById('captureBtn');

    if (imageData) {
      if (previewOverlay) previewOverlay.classList.add('hidden');
      if (previewStatus) previewStatus.className = 'status-dot online';
      if (previewStatusText) previewStatusText.textContent = 'Video stream aktif';
      if (captureBtn) captureBtn.disabled = false;
    }
  },

  handlePhotoReady() {
    const captureBtn = document.getElementById('captureBtn');
    if (captureBtn) {
      captureBtn.classList.add('flash');
      setTimeout(() => captureBtn.classList.remove('flash'), 500);
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  App.init();

  if (document.getElementById('cameraVideo')) {
    PhotoboothCamera.init();
  }

  if (document.getElementById('streamVideo')) {
    PhotoboothPreview.init();
  }
});

window.App = App;
window.PhotoboothCamera = PhotoboothCamera;
window.PhotoboothPreview = PhotoboothPreview;