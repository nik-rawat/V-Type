import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

let client = null;

const connectRedis = async () => {
  try {
    if (!process.env.REDIS_HOST || !process.env.REDIS_PORT || !process.env.REDIS_PASSWORD) {
      throw new Error('Redis environment variables are not properly configured');
    }

    console.log('Attempting to connect to Redis...');

    // Modern Redis v4+ client
    client = createClient({
      socket: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT)
      },
      password: process.env.REDIS_PASSWORD
    });

    client.on('error', (err) => console.error('Redis Client Error:', err));
    client.on('connect', () => console.log('Redis client connected'));
    client.on('ready', () => console.log('Redis client ready'));

    await client.connect();
    console.log('Connected to Redis successfully');
    
    return client;
  } catch (error) {
    console.error('Error connecting to Redis:', error);
    throw error;
  }
};

// Get Redis client instance
const getRedisClient = () => {
  if (!client) {
    throw new Error('Redis client not initialized. Call connectRedis() first.');
  }
  return client;
};

// Disconnect Redis client
const disconnectRedis = async () => {
  if (client) {
    await client.quit();
    client = null;
    console.log('Redis client disconnected');
  }
};

export { connectRedis, getRedisClient, disconnectRedis };