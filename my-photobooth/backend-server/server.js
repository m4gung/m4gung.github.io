const express = require('express');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');

const app = express();

const certPath = path.join(__dirname);
const keyPath = path.join(certPath, 'key.pem');
const certFilePath = path.join(certPath, 'cert.pem');

let server;
if (fs.existsSync(keyPath) && fs.existsSync(certFilePath)) {
  const httpsOptions = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certFilePath)
  };
  server = https.createServer(httpsOptions, app);
  console.log('[HTTPS] Using SSL certificates');
} else {
  server = http.createServer(app);
  console.log('[HTTP] SSL certificates not found, running on HTTP');
}

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const uploadDir = path.join(__dirname, 'uploads');
const rawDir = path.join(uploadDir, 'raw');
const finalDir = path.join(uploadDir, 'final');

[uploadDir, rawDir, finalDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const PORT = 3000;
const HOST = '0.0.0.0';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const type = req.params.type || 'raw';
    const destDir = type === 'final' ? finalDir : rawDir;
    cb(null, destDir);
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
  res.sendFile(path.join(__dirname, '../frontend-pwa/index.html'));
});

app.get('/camera.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend-pwa/camera.html'));
});

app.get('/preview.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend-pwa/preview.html'));
});

app.get('/edit.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend-pwa/edit.html'));
});

app.use('/js', express.static(path.join(__dirname, '../frontend-pwa/js')));
app.use('/css', express.static(path.join(__dirname, '../frontend-pwa/css')));
app.use('/assets', express.static(path.join(__dirname, '../frontend-pwa/assets')));
app.use('/manifest.json', express.static(path.join(__dirname, '../frontend-pwa/manifest.json')));

app.post('/upload/:type', upload.single('photo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const type = req.params.type || 'raw';
  const photoUrl = `https://${req.get('host')}/uploads/${type}/${req.file.filename}`;

  io.emit('photo_saved', {
    filename: req.file.filename,
    url: photoUrl,
    path: req.file.path,
    type
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
    const destDir = type === 'final' ? finalDir : rawDir;
    const filepath = path.join(destDir, filename);

    fs.writeFileSync(filepath, Buffer.from(base64Data, 'base64'));

    const photoUrl = `https://${req.get('host')}/uploads/${type}/${filename}`;

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

app.use('/uploads/raw', express.static(rawDir));
app.use('/uploads/final', express.static(finalDir));

app.get('/photos', (req, res) => {
  try {
    const type = req.query.type || 'raw';
    const dir = type === 'final' ? finalDir : rawDir;
    const files = fs.readdirSync(dir);
    const photos = files
      .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
      .map(file => ({
        filename: file,
        url: `https://${req.get('host')}/uploads/${type}/${file}`
      }));

    res.json({ photos });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/uploads/:type/:filename', (req, res) => {
  try {
    const { type, filename } = req.params;
    const dir = type === 'final' ? finalDir : rawDir;
    const filepath = path.join(dir, filename);

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
    console.log('Photo ready from camera, forwarding to preview. Data has image:', !!data.image);
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
║  Local Server:  https://${HOST}:${PORT}                        
║  Status:        Running ✓                                     ║
║  Upload Dir:    ${uploadDir}             
║  Socket.IO:     Enabled ✓                                    ║
╚═══════════════════════════════════════════════════════════════╝

📱 Open in browser:
   - iPhone Camera: https://${HOST}:${PORT}/camera.html
   - iPad Preview: https://${HOST}:${PORT}/preview.html
`);
});

process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});