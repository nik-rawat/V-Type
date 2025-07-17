import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
import cors from 'cors';
import { connectDB } from './src/config/database.js';
import { connectSocket } from './src/config/websocket.js';
import { connectRedis } from './src/config/redis.js';
import authRoutes from './src/routes/auth.js';
import chatRoutes from './src/routes/chat.js';

dotenv.config();

const app = express();

//Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK', 
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
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
    // Database connection
    await connectDB();
    
    // Redis connection
    await connectRedis();
    
    // Websocket connection
    connectSocket(server);
    
    console.log('All connections initialized successfully');
  } catch (error) {
    console.error('Failed to initialize connections:', error);
    process.exit(1);
  }
};

// Start server
initializeConnections().then(() => {
  server.listen(PORT, () => {
    console.log(`Server is listening on port: ${PORT}`);
  });
});