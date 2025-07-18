import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './src/config/database.js';
import { initGridFS } from './src/config/gridfs.js';
import { connectSocket } from './src/config/webSocket.js';
import { connectRedis } from './src/config/redis.js';
import { initializeCleanupSchedulers, stopCleanupSchedulers } from './src/services/scheduler.js';
import authRoutes from './src/routes/auth.js';
import chatRoutes from './src/routes/chat.js';
import userRoutes from './src/routes/user.js';
import adminRoutes from './src/routes/admin.js';

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files (uploaded images)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK', 
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'VType Backend API', status: 'running' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Initialize connections
const initializeConnections = async () => {
  try {
    // Database connection first
    await connectDB();
    console.log('Database connected');
    
    // Initialize GridFS after database connection
    await initGridFS();
    console.log('GridFS initialized');
    
    // Redis connection
    try {
      await connectRedis();
      console.log('Redis connected');
      
      // Initialize cleanup schedulers after Redis is connected
      initializeCleanupSchedulers();
    } catch (error) {
      console.warn('Redis connection failed, continuing without Redis:', error.message);
    }
    
    // Websocket connection
    connectSocket(server);
    console.log('WebSocket initialized');
    
    console.log('All connections initialized successfully');
  } catch (error) {
    console.error('Failed to initialize connections:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  stopCleanupSchedulers();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  stopCleanupSchedulers();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Start server
initializeConnections().then(() => {
  server.listen(PORT, () => {
    console.log(`Server is listening on port: ${PORT}`);
  });
});