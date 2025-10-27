const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { log } = require('./utils/logger');

// Import routes
const authRoutes = require('./routes/auth');
const problemRoutes = require('./routes/problems');
const submissionRoutes = require('./routes/submissions');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS Configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  log(`${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api', problemRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'エンドポイントが見つかりません' });
});

// Error handler
app.use((err, req, res, next) => {
  log(`Error: ${err.message}`, 'ERROR');
  res.status(err.status || 500).json({
    error: err.message || 'サーバーエラーが発生しました'
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  log(`Server is running on port ${PORT}`);
  console.log(`
  ╔══════════════════════════════════════════════╗
  ║  Scratch Learning System - Backend Server   ║
  ║  Port: ${PORT}                                  ║
  ║  Environment: ${process.env.NODE_ENV || 'development'}                  ║
  ╚══════════════════════════════════════════════╝
  `);
});

module.exports = app;
