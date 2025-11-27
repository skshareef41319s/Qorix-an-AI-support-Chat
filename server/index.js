require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');

const app = express();

// Middlewares
app.use(express.json());

const FRONTEND_ORIGINS = (process.env.FRONTEND_ORIGINS || 'http://localhost:5173').split(',');
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (FRONTEND_ORIGINS.includes(origin)) return callback(null, true);
    return callback(new Error('CORS policy: origin not allowed'), false);
  }
}));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.get('/api/ready', (req, res) => {
  const ready = mongoose.connection.readyState === 1;
  res.json({ ready });
});
const messageRoutes = require('./routes/messages');
app.use('/api/messages', messageRoutes);

const convRoutes = require('./routes/conversations');
app.use('/api/conversations', convRoutes);

app.use('/api/auth', authRoutes);

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err && err.stack ? err.stack : err);
  res.status(500).json({ error: 'Internal server error' });
});

async function start() {
  try {
    if (!process.env.MONGO_URI) {
      console.error('MONGO_URI is not set in .env');
      process.exit(1);
    }
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on ${PORT}`));
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  }
}

start();

process.on('SIGINT', async () => {
  console.log('SIGINT received — closing mongoose connection');
  await mongoose.disconnect();
  process.exit(0);
});
