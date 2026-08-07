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
import fs from 'fs';
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

// Health Check
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingRoutes);

// Global JSON Error Handler for API routes
app.use((err, req, res, next) => {
  console.error('API Server Error:', err);
  if (req.path.startsWith('/api')) {
    return res.status(err.status || 500).json({
      error: err.message || 'Internal Server Error'
    });
  }
  next(err);
});

// Server entry point updated at 2026-08-07T01:40:00+05:30
// Serve static frontend build from dist folder
const distPath = path.join(__dirname, '../dist');
const distIndexPath = path.join(distPath, 'index.html');
app.use(express.static(distPath));

// Fallback all non-API browser routes to index.html
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
    return next();
  }
  if (fs.existsSync(distIndexPath)) {
    res.sendFile(distIndexPath);
  } else {
    res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <head><title>Aamantran Self-Ordering Platform</title></head>
        <body style="font-family: sans-serif; text-align: center; padding: 3rem; background: #0f172a; color: #fff;">
          <h2>🚀 Aamantran API & Socket.io Server Running</h2>
          <p>Please open <a href="http://localhost:3000" style="color: #f97316; font-weight: bold;">http://localhost:3000/</a> to view the live web app.</p>
        </body>
      </html>
    `);
  }
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
      console.log(`🚀 Aamantran Express & Socket.io server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
  });
