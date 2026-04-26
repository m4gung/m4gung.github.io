const SocketClient = {
  socket: null,
  isConnected: false,
  serverIP: localStorage.getItem('photobooth_server_ip') || '',
  serverPort: localStorage.getItem('photobooth_server_port') || '',

  get serverUrl() {
    if (this.serverIP) {
      const port = this.serverPort || (window.location.protocol === 'https:' ? '443' : '80');
      return `${window.location.protocol}//${this.serverIP}:${port}`;
    }
    const port = this.serverPort || window.location.port;
    if (port && port !== '80' && port !== '443') {
      return `${window.location.protocol}//${window.location.hostname}:${port}`;
    }
    return window.location.origin;
  },

  init() {
    this.connect();
  },

  connect() {
    if (this.socket) {
      this.socket.disconnect();
    }

    this.socket = io(this.serverUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    this.setupListeners();
  },

  setupListeners() {
    this.socket.on('connect', () => {
      console.log('[Socket] Connected:', this.socket.id);
      this.isConnected = true;
      this.updateConnectionStatus(true);
      this.register();
    });

    this.socket.on('disconnect', () => {
      console.log('[Socket] Disconnected');
      this.isConnected = false;
      this.updateConnectionStatus(false);
    });

    this.socket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error);
      this.isConnected = false;
      this.updateConnectionStatus(false, error.message);
    });

    this.socket.on('photo_request', () => {
      console.log('[Socket] photo_request received - triggering capture');
      if (typeof WebRTCCore !== 'undefined') {
        WebRTCCore.capturePhoto();
      }
    });

    this.socket.on('photo_saved', (data) => {
      console.log('[Socket] photo_saved received:', data);
      if (data.type === 'final') {
        if (typeof PhotoEditor !== 'undefined') {
          PhotoEditor.addToGallery(data);
        }
        if (typeof CanvasEditor !== 'undefined') {
          CanvasEditor.addToGallery(data);
        }
        App.showNotification('Foto disimpan ke galeri!', 'success');
      }
    });

    this.socket.on('camera_stream_update', (data) => {
      console.log('[Socket] camera_stream_update received, isPhoto:', data.isPhoto, 'hasImage:', !!data.image);
      if (typeof WebRTCCore !== 'undefined' && data.image) {
        if (data.isPhoto === true) {
          WebRTCCore.showCapturedPhoto(data.image);
          if (typeof LayoutManager !== 'undefined') {
            LayoutManager.onPhotoTaken(data.image);
          }
        } else {
          WebRTCCore.updateStream(data.image);
        }
      }
    });

    this.socket.on('photo_ready_response', (data) => {
      if (data.image && typeof WebRTCCore !== 'undefined') {
        WebRTCCore.showCapturedPhoto(data.image);
      }
    });
  },

  register() {
    const deviceType = this.getDeviceType();
    this.socket.emit('register', { deviceType });
    console.log('[Socket] Registered as:', deviceType);
  },

  getDeviceType() {
    const path = window.location.pathname;
    if (path.includes('camera.html')) return 'camera';
    if (path.includes('preview.html')) return 'preview';
    return 'unknown';
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

  emit(event, data) {
    this.socket?.emit(event, data);
  },

  on(event, callback) {
    this.socket?.on(event, callback);
  }
};

window.SocketClient = SocketClient;