const WebRTCHandshake = {
  peerConnection: null,
  dataChannel: null,
  remoteSocketId: null,
  isInitiator: false,

  config: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  },

  init(deviceType) {
    this.deviceType = deviceType;
    this.setupSocketListeners();
  },

  setupSocketListeners() {
    App.socket?.on('device_registered', (data) => {
      console.log('Devices registered:', data.connectedDevices);
      this.handleDeviceRegistration(data.connectedDevices);
    });

    App.socket?.on('webrtc_signal', (data) => {
      this.handleSignal(data);
    });

    App.socket?.on('device_unregistered', (data) => {
      console.log('Device unregistered:', data.socketId);
      this.handleDeviceUnregistration(data.socketId);
    });
  },

  async handleDeviceRegistration(devices) {
    if (this.deviceType === 'camera' && devices.length > 1) {
      const previewDevice = devices.find(d => d.deviceType === 'preview');
      if (previewDevice) {
        this.remoteSocketId = previewDevice.socketId;
        await this.createOffer();
      }
    }
  },

  handleDeviceUnregistration(socketId) {
    if (this.remoteSocketId === socketId) {
      this.closeConnection();
    }
  },

  async createOffer() {
    if (!this.remoteSocketId) {
      console.error('No remote device to connect to');
      return;
    }

    this.peerConnection = new RTCPeerConnection(this.config);
    this.setupPeerConnectionHandlers();

    this.dataChannel = this.peerConnection.createDataChannel('photoboothData', {
      ordered: true
    });
    this.setupDataChannelHandlers();

    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);

    this.sendSignal({
      type: 'offer',
      sdp: offer.sdp,
      sdpMid: offer.sdpMid
    });
  },

  async handleSignal(data) {
    const { fromSocketId, signal } = data;
    this.remoteSocketId = fromSocketId;

    if (signal.type === 'offer') {
      await this.handleOffer(signal);
    } else if (signal.type === 'answer') {
      await this.handleAnswer(signal);
    } else if (signal.type === 'candidate') {
      await this.handleCandidate(signal);
    }
  },

  async handleOffer(signal) {
    this.peerConnection = new RTCPeerConnection(this.config);
    this.setupPeerConnectionHandlers();

    this.peerConnection.ondatachannel = (event) => {
      this.dataChannel = event.channel;
      this.setupDataChannelHandlers();
    };

    await this.peerConnection.setRemoteDescription(new RTCSessionDescription({
      type: signal.type,
      sdp: signal.sdp
    }));

    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);

    this.sendSignal({
      type: 'answer',
      sdp: answer.sdp,
      sdpMid: answer.sdpMid
    });
  },

  async handleAnswer(signal) {
    if (this.peerConnection) {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription({
        type: signal.type,
        sdp: signal.sdp
      }));
    }
  },

  async handleCandidate(signal) {
    if (this.peerConnection && signal.candidate) {
      try {
        await this.peerConnection.addIceCandidate(new RTCIceCandidate(signal.candidate));
      } catch (error) {
        console.error('Error adding ICE candidate:', error);
      }
    }
  },

  setupPeerConnectionHandlers() {
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignal({
          type: 'candidate',
          candidate: event.candidate
        });
      }
    };

    this.peerConnection.oniceconnectionstatechange = () => {
      console.log('ICE connection state:', this.peerConnection.iceConnectionState);
      
      const statusDot = document.querySelector('.status-dot');
      if (statusDot) {
        if (this.peerConnection.iceConnectionState === 'connected') {
          statusDot.className = 'status-dot online';
        } else if (['disconnected', 'failed', 'closed'].includes(this.peerConnection.iceConnectionState)) {
          statusDot.className = 'status-dot offline';
        }
      }
    };

    this.peerConnection.ontrack = (event) => {
      console.log('Received remote stream:', event.streams[0]);
      
      const videoElement = document.getElementById('streamVideo');
      if (videoElement && event.streams[0]) {
        videoElement.srcObject = event.streams[0];
      }
    };

    this.peerConnection.onicegatheringstatechange = () => {
      console.log('ICE gathering state:', this.peerConnection.iceGatheringState);
    };
  },

  setupDataChannelHandlers() {
    this.dataChannel.onopen = () => {
      console.log('Data channel opened');
      App.showNotification('Koneksi video siap!', 'success');
    };

    this.dataChannel.onclose = () => {
      console.log('Data channel closed');
    };

    this.dataChannel.onmessage = (event) => {
      this.handleDataChannelMessage(event.data);
    };

    this.dataChannel.onerror = (error) => {
      console.error('Data channel error:', error);
    };
  },

  handleDataChannelMessage(data) {
    try {
      const message = JSON.parse(data);
      
      switch (message.type) {
        case 'photo_request':
          PhotoboothCamera.capturePhoto()
            .then(imageData => {
              this.sendData({
                type: 'photo_response',
                image: imageData
              });
            });
          break;
          
        case 'photo_response':
          PhotoboothPreview.currentPhoto = message.image;
          PhotoboothPreview.updatePhotoDisplay(message.image);
          break;
          
        case 'frame_change':
          if (typeof PhotoEditor !== 'undefined') {
            PhotoEditor.setFrame(message.frame);
          }
          break;
      }
    } catch (error) {
      console.log('Received binary data');
    }
  },

  sendSignal(signal) {
    if (this.remoteSocketId) {
      App.socket?.emit('webrtc_signal', {
        targetSocketId: this.remoteSocketId,
        signal: signal
      });
    }
  },

  sendData(data) {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      this.dataChannel.send(JSON.stringify(data));
    }
  },

  sendPhoto(imageData) {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      const maxSize = 1024 * 1024;
      if (imageData.length > maxSize) {
        console.warn('Image too large for data channel, using server upload');
        return false;
      }
      
      this.sendData({
        type: 'photo',
        image: imageData,
        timestamp: Date.now()
      });
      return true;
    }
    return false;
  },

  closeConnection() {
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

window.WebRTCHandshake = WebRTCHandshake;