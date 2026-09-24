require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { initDB } = require('./config/db');

const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const authRoutes = require('./routes/authRoutes');
const couponRoutes = require('./routes/couponRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS — fail fast in production if the frontend origin isn't configured
const FRONTEND_URL = process.env.FRONTEND_URL;
if (!FRONTEND_URL && process.env.NODE_ENV === 'production') {
  console.error('FATAL: FRONTEND_URL env var is not set. All browser requests will be CORS-rejected.');
  process.exit(1);
}

app.use(helmet());
app.use(cors({
  origin: FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// Rate limiter — use a shared Redis store when REDIS_URL is set so limits
// are enforced across multiple instances; falls back to in-memory otherwise.
const makeLimiterStore = () => {
  if (!process.env.REDIS_URL) return undefined;
  try {
    const { RedisStore } = require('rate-limit-redis');
    const Redis = require('ioredis');
    const client = new Redis(process.env.REDIS_URL, { lazyConnect: true });
    return new RedisStore({ sendCommand: (...args) => client.call(...args) });
  } catch {
    console.warn('rate-limit-redis unavailable — falling back to in-memory store');
    return undefined;
  }
};

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 20,
  standardHeaders: true, legacyHeaders: false,
  store: makeLimiterStore(),
});
app.use('/api/auth', authLimiter);

const couponLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 30,
  message: { message: 'Too many coupon attempts, please try again later.' },
  standardHeaders: true, legacyHeaders: false,
  store: makeLimiterStore(),
});
app.use('/api/coupons', couponLimiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'E-Commerce API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/coupons', couponRoutes);

// 404 handler — catch undefined API paths before the error handler
app.use((req, res) => {
  res.status(404).json({ message: `No endpoint at ${req.method} ${req.path}` });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Initialize database and start server
const startServer = async () => {
  try {
    await initDB();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
