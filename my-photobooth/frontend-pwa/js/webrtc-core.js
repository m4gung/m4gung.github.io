const WebRTCCore = {
  peerConnection: null,
  dataChannel: null,
  remoteSocketId: null,
  isInitiator: false,
  videoElement: null,
  canvasElement: null,
  stream: null,
  frameInterval: null,

  config: {
    iceServers: []
  },

  get isCamera() {
    return window.location.pathname.includes('camera.html');
  },

  get isPreview() {
    return window.location.pathname.includes('preview.html');
  },

  init() {
    if (this.isCamera) {
      this.initCamera();
    } else if (this.isPreview) {
      this.initPreview();
    }
    this.setupSocketListeners();
  },

  initCamera() {
    this.videoElement = document.getElementById('cameraVideo');
    this.canvasElement = document.getElementById('captureCanvas');
    this.bindCameraEvents();
    this.startCamera();
  },

  initPreview() {
    this.videoElement = document.getElementById('streamVideo');
    this.canvasElement = document.getElementById('previewCanvas');
  },

  async startCamera(deviceId = null) {
    const overlay = document.getElementById('cameraOverlay');
    const statusText = document.getElementById('cameraStatusText');
    const cameraStatus = document.getElementById('cameraStatus');

    const constraints = {
      video: {
        facingMode: 'environment',
        width: { ideal: 1280 },
        height: { ideal: 960 }
      },
      audio: false
    };

    try {
      console.log('[WebRTC] Requesting camera access...');
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (this.videoElement) {
        this.videoElement.srcObject = this.stream;
        await this.videoElement.play();
      }

      if (overlay) overlay.classList.add('hidden');
      if (statusText) statusText.textContent = 'Kamera aktif!';
      if (cameraStatus) cameraStatus.classList.add('online');

      SocketClient.emit('camera_ready', { hasStream: true });
      this.startStreamLoop();
      
      console.log('[WebRTC] Camera started successfully');
      return true;
    } catch (error) {
      console.error('[WebRTC] Camera error:', error);
      
      if (overlay) overlay.classList.remove('hidden');
      if (statusText) statusText.textContent = 'Gagal akses kamera';
      if (cameraStatus) cameraStatus.classList.remove('online');
      
      App.showNotification('Izinkan akses kamera di browser', 'error');
      return false;
    }
  },

  startStreamLoop() {
    if (this.frameInterval) return;
    if (!this.isCamera) return;

    const streamCanvas = document.createElement('canvas');
    streamCanvas.width = 640;
    streamCanvas.height = 480;
    const streamCtx = streamCanvas.getContext('2d');

    const intervalMs = 100;

    this.frameInterval = setInterval(() => {
      if (!this.stream || !this.videoElement) return;
      if (this.videoElement.readyState !== 4) return;

      const vw = this.videoElement.videoWidth;
      const vh = this.videoElement.videoHeight;
      if (vw === 0 || vh === 0) return;

      streamCanvas.width = 640;
      streamCanvas.height = 480;
      streamCtx.drawImage(this.videoElement, 0, 0, 640, 480);

      const imageData = streamCanvas.toDataURL('image/jpeg', 0.5);
      console.log('[WebRTC] Stream frame sent, isPhoto: false, length:', imageData.length);
      SocketClient.emit('camera_stream', { image: imageData, isPhoto: false });
    }, intervalMs);
  },

  stopStreamLoop() {
    if (this.frameInterval) {
      clearInterval(this.frameInterval);
      this.frameInterval = null;
    }
  },

  async capturePhoto() {
    if (!this.videoElement || !this.stream) {
      console.error('[WebRTC] Camera not started');
      return null;
    }

    const canvas = this.canvasElement || document.createElement('canvas');
    canvas.width = this.videoElement.videoWidth;
    canvas.height = this.videoElement.videoHeight;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(this.videoElement, 0, 0);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.5);

    SocketClient.emit('photo_ready', {
      timestamp: Date.now(),
      hasImage: true
    });

    console.log('[WebRTC] Photo captured, sending with isPhoto: true');
    SocketClient.emit('camera_stream', {
      image: dataUrl,
      isPhoto: true
    });

    return dataUrl;
  },

  updateStream(imageData) {
    const previewOverlay = document.getElementById('previewOverlay');
    const previewStatus = document.getElementById('previewStatus');
    const previewStatusText = document.getElementById('previewStatusText');
    const captureBtn = document.getElementById('captureBtn');
    const streamImage = document.getElementById('streamImage');
    const streamVideo = document.getElementById('streamVideo');

    if (streamVideo) {
      streamVideo.pause();
      streamVideo.classList.add('hidden');
    }

    if (streamImage) {
      streamImage.src = imageData;
      streamImage.classList.remove('hidden');
    }

    if (previewOverlay) previewOverlay.classList.add('hidden');
    if (previewStatus) previewStatus.className = 'status-dot online';
    if (previewStatusText) previewStatusText.textContent = 'Video stream aktif';
    if (captureBtn) captureBtn.disabled = false;
  },

  showCapturedPhoto(imageData) {
    const streamImage = document.getElementById('streamImage');
    const streamVideo = document.getElementById('streamVideo');
    const previewOverlay = document.getElementById('previewOverlay');
    const retakeBtn = document.getElementById('retakeBtn');
    const doneBtn = document.getElementById('doneBtn');

    if (streamVideo) {
      streamVideo.pause();
      streamVideo.classList.add('hidden');
    }

    if (streamImage) {
      streamImage.src = imageData;
      streamImage.classList.remove('hidden');
    }

    if (previewOverlay) previewOverlay.classList.add('hidden');
    if (retakeBtn) retakeBtn.disabled = false;
    if (doneBtn) doneBtn.disabled = false;
    
    console.log('[WebRTC] showCapturedPhoto, sending to editors');
    
    // Save to PhotoboothPreview currentPhoto
    if (typeof PhotoboothPreview !== 'undefined') {
      PhotoboothPreview.currentPhoto = imageData;
    }

    if (typeof PhotoEditor !== 'undefined') {
      PhotoEditor.setImage(imageData);
    }
    if (typeof CanvasEditor !== 'undefined') {
      CanvasEditor.setImage(imageData);
    }

    App.showNotification('Foto berhasil diambil!', 'success');
  },

  setupSocketListeners() {
    SocketClient.on('device_registered', (data) => {
      this.handleDevices(data.connectedDevices);
    });

    SocketClient.on('take_photo', () => {
      this.capturePhoto();
    });

    SocketClient.on('webrtc_signal', (data) => {
      this.handleSignal(data);
    });

    SocketClient.on('device_unregistered', (data) => {
      console.log('[WebRTC] Device unregistered:', data.socketId);
    });
  },

  handleDevices(devices) {
    if (this.isCamera && devices.length > 1) {
      const previewDevice = devices.find(d => d.deviceType === 'preview');
      if (previewDevice) {
        this.remoteSocketId = previewDevice.socketId;
      }
    }
  },

  handleSignal(data) {
    const { fromSocketId, signal } = data;
    this.remoteSocketId = fromSocketId;
  },

  bindCameraEvents() {
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
  },

  closeConnection() {
    this.stopStreamLoop();

    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    this.remoteSocketId = null;
  }
};

window.WebRTCCore = WebRTCCore;