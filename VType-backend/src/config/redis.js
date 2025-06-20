import redis from 'redis';
import dotenv from 'dotenv';

dotenv.config();

let client = null;

const connectRedis = async () => {
  try {
    if (!process.env.REDIS_HOST || !process.env.REDIS_PORT || !process.env.REDIS_PASSWORD) {
      throw new Error('Redis environment variables are not properly configured');
    }

    // Create Redis client - compatible with older versions
    client = redis.createClient({
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
      password: process.env.REDIS_PASSWORD,
      retry_strategy: (options) => {
        if (options.error && options.error.code === 'ECONNREFUSED') {
          return new Error('The server refused the connection');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
          return new Error('Retry time exhausted');
        }
        if (options.attempt > 10) {
          return undefined;
        }
        return Math.min(options.attempt * 100, 3000);
      }
    });

    // Handle Redis events
    client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    client.on('connect', () => {
      console.log('Redis client connected');
    });

    client.on('ready', () => {
      console.log('Redis client ready to use');
    });

    client.on('end', () => {
      console.log('Redis client disconnected');
    });

    // For older versions of redis, connection is automatic
    // For newer versions, we need to check if connect method exists
    if (typeof client.connect === 'function') {
      await client.connect();
    }
    
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
    if (typeof client.quit === 'function') {
      await client.quit();
    } else if (typeof client.disconnect === 'function') {
      await client.disconnect();
    }
    client = null;
    console.log('Redis client disconnected');
  }
};

export { connectRedis, getRedisClient, disconnectRedis };