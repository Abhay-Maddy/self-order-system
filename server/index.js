import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { initDb } from './db.js';

import authRoutes from './routes/authRoutes.js';
import menuRoutes from './routes/menuRoutes.js';
import tableRoutes from './routes/tableRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import couponRoutes from './routes/couponRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import settingRoutes from './routes/settingRoutes.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE']
  }
});

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));
app.options('*', cors());
app.use(express.json());

// Pass Socket.io to Express req
app.set('io', io);

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingRoutes);

// Serve static frontend build from dist folder
const distPath = path.join(__dirname, '../dist');
const distIndexPath = path.join(distPath, 'index.html');
app.use(express.static(distPath));

// Fallback all non-API routes to index.html (Fixes "Cannot GET /")
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
    return next();
  }
  import('fs').then(fs => {
    if (fs.existsSync(distIndexPath)) {
      res.sendFile(distIndexPath);
    } else {
      res.status(200).json({ message: 'Amantradha API Server is running. Frontend served separately via Vercel.' });
    }
  });
});

// Socket.io Connection & Room Logic
io.on('connection', (socket) => {
  console.log('Socket client connected:', socket.id);

  socket.on('join_room', (room) => {
    socket.join(room);
    console.log(`Client ${socket.id} joined room: ${room}`);
  });

  socket.on('disconnect', () => {
    console.log('Socket client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;

// Initialize Database and Start Server
initDb()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`🚀 Amantradha Express & Socket.io server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
  });
