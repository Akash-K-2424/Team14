const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const path = require('path');

// Load environment variables
dotenv.config();

// Initialize Express
const app = express();

// ========================================
// Middleware
// ========================================
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:5174',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ========================================
// Health Check Route
// ========================================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'ResuAI API is running',
    timestamp: new Date().toISOString(),
  });
});

// ========================================
// API Routes
// ========================================
app.use('/api/auth', require('./routes/auth'));
app.use('/api/resumes', require('./routes/resume'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/members', require('./routes/member'));

// ========================================
// 404 Handler
// ========================================
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ========================================
// Global Error Handler
// ========================================
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// ========================================
// Start Server
// ========================================
const PORT = process.env.PORT || 5001;

const startServer = async () => {
  // Connect to MongoDB
  await connectDB();

  app.listen(PORT, () => {
    console.log(`\n🚀 ResuAI Server running on port ${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/api/health\n`);
  });
};

startServer();
