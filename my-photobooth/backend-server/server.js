const express = require('express');
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = 3000;
const HOST = '0.0.0.0';

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  }
});

const upload = multer({ storage });

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'My Photobooth Server',
    endpoints: {
      upload: 'POST /upload',
      uploadBase64: 'POST /upload-base64',
      listPhotos: 'GET /photos',
      download: 'GET /uploads/:filename'
    }
  });
});

app.post('/upload', upload.single('photo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  const photoUrl = `https://${HOST}:${PORT}/uploads/${req.file.filename}`;
  
  io.emit('photo_saved', {
    filename: req.file.filename,
    url: photoUrl,
    path: req.file.path
  });
  
  res.json({
    success: true,
    filename: req.file.filename,
    url: photoUrl
  });
});

app.post('/upload-base64', (req, res) => {
  try {
    const { image, type = 'raw' } = req.body;
    
    if (!image) {
      return res.status(400).json({ error: 'No image data provided' });
    }
    
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const ext = 'png';
    const filename = `${type}_${uuidv4()}.${ext}`;
    const filepath = path.join(uploadDir, filename);
    
    fs.writeFileSync(filepath, Buffer.from(base64Data, 'base64'));
    
    const photoUrl = `https://${HOST}:${PORT}/uploads/${filename}`;
    
    io.emit('photo_saved', {
      filename,
      url: photoUrl,
      path: filepath,
      type
    });
    
    res.json({
      success: true,
      filename,
      url: photoUrl
    });
  } catch (error) {
    console.error('Upload base64 error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.use('/uploads', express.static(uploadDir));

app.get('/photos', (req, res) => {
  try {
    const files = fs.readdirSync(uploadDir);
    const photos = files
      .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
      .map(file => ({
        filename: file,
        url: `https://${HOST}:${PORT}/uploads/${file}`
      }));
    
    res.json({ photos });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/uploads/:filename', (req, res) => {
  try {
    const filepath = path.join(uploadDir, req.params.filename);
    
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    fs.unlinkSync(filepath);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const connectedDevices = new Map();

io.on('connection', (socket) => {
  console.log('Device connected:', socket.id);
  
  socket.on('register', (data) => {
    const { deviceType } = data;
    connectedDevices.set(socket.id, { deviceType, socket });
    
    io.emit('device_registered', {
      socketId: socket.id,
      deviceType,
      connectedDevices: Array.from(connectedDevices.entries()).map(([id, d]) => ({
        socketId: id,
        deviceType: d.deviceType
      }))
    });
    
    console.log(`Device registered: ${deviceType} (${socket.id})`);
  });
  
  socket.on('take_photo', (data) => {
    console.log('Take photo request received');
    socket.broadcast.emit('photo_request');
  });
  
  socket.on('photo_ready', (data) => {
    console.log('Photo ready from camera');
    socket.broadcast.emit('photo_ready_response', data);
  });
  
  socket.on('webrtc_signal', (data) => {
    const { targetSocketId, signal } = data;
    const targetDevice = connectedDevices.get(targetSocketId);
    
    if (targetDevice) {
      targetDevice.socket.emit('webrtc_signal', {
        fromSocketId: socket.id,
        signal
      });
    }
  });
  
  socket.on('camera_stream', (data) => {
    socket.broadcast.emit('camera_stream_update', data);
  });
  
  socket.on('preview_photo', (data) => {
    socket.broadcast.emit('preview_photo_update', data);
  });
  
  socket.on('disconnect', () => {
    const device = connectedDevices.get(socket.id);
    console.log('Device disconnected:', socket.id, device?.deviceType);
    connectedDevices.delete(socket.id);
    
    io.emit('device_unregistered', {
      socketId: socket.id
    });
  });
});

server.listen(PORT, HOST, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                    My Photobooth Server                       ║
╠═══════════════════════════════════════════════════════════════╣
║  Local Server:  http://${HOST}:${PORT}                        
║  Status:        Running ✓                                     ║
║  Upload Dir:    ${uploadDir}             
║  Socket.IO:     Enabled ✓                                    ║
╚═══════════════════════════════════════════════════════════════╝

📱 Open in browser:
   - iPhone Camera: http://${HOST}:${PORT}/camera.html
   - iPad Preview: http://${HOST}:${PORT}/preview.html

⚠️  Note: For HTTPS (required for iOS camera access):
   Generate SSL certs with mkcert:
   1. npm install -g mkcert
   2. mkcert -install
   3. cd backend-server
   4. mkcert 192.168.1.10 localhost 127.0.0.1
   5. Update server.js to use HTTPS
  `);
});

process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});