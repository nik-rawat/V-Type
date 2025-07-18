import { getRedisClient } from '../config/redis.js';
import jwt from 'jsonwebtoken';

// Clean up expired access tokens (1 hour expiry)
export const cleanupExpiredAccessTokens = async () => {
  try {
    const client = getRedisClient();
    if (!client) {
      console.log('Redis client not available for access token cleanup');
      return;
    }

    console.log('Starting access token cleanup...');
    
    // Get all access token keys
    const accessTokenKeys = await client.keys('access_token:*');
    let cleanedCount = 0;

    for (const key of accessTokenKeys) {
      try {
        const token = await client.get(key);
        if (!token) {
          // Key exists but no value, remove it
          await client.del(key);
          cleanedCount++;
          continue;
        }

        // Verify if token is expired
        try {
          jwt.verify(token, process.env.JWT_ACCESS_SECRET);
          // Token is still valid, keep it
        } catch (error) {
          if (error.name === 'TokenExpiredError') {
            // Token is expired, remove it
            await client.del(key);
            cleanedCount++;
            console.log(`Removed expired access token: ${key}`);
          }
        }
      } catch (error) {
        console.error(`Error processing access token ${key}:`, error);
      }
    }

    console.log(`Access token cleanup completed. Removed ${cleanedCount} expired tokens.`);
    return cleanedCount;
  } catch (error) {
    console.error('Error during access token cleanup:', error);
    return 0;
  }
};

// Clean up expired refresh tokens (24 hours expiry)
export const cleanupExpiredRefreshTokens = async () => {
  try {
    const client = getRedisClient();
    if (!client) {
      console.log('Redis client not available for refresh token cleanup');
      return;
    }

    console.log('Starting refresh token cleanup...');
    
    // Get all refresh token keys
    const refreshTokenKeys = await client.keys('refresh_token:*');
    let cleanedCount = 0;

    for (const key of refreshTokenKeys) {
      try {
        const token = await client.get(key);
        if (!token) {
          // Key exists but no value, remove it
          await client.del(key);
          cleanedCount++;
          continue;
        }

        // Verify if token is expired
        try {
          jwt.verify(token, process.env.JWT_REFRESH_SECRET);
          // Token is still valid, keep it
        } catch (error) {
          if (error.name === 'TokenExpiredError') {
            // Token is expired, remove it
            await client.del(key);
            cleanedCount++;
            console.log(`Removed expired refresh token: ${key}`);
          }
        }
      } catch (error) {
        console.error(`Error processing refresh token ${key}:`, error);
      }
    }

    console.log(`Refresh token cleanup completed. Removed ${cleanedCount} expired tokens.`);
    return cleanedCount;
  } catch (error) {
    console.error('Error during refresh token cleanup:', error);
    return 0;
  }
};

// Clean up all session-related data for inactive users
export const cleanupInactiveSessions = async () => {
  try {
    const client = getRedisClient();
    if (!client) {
      console.log('Redis client not available for session cleanup');
      return;
    }

    console.log('Starting inactive session cleanup...');
    
    // Get all session keys (if you have any)
    const sessionKeys = await client.keys('session:*');
    const userStatusKeys = await client.keys('user_status:*');
    let cleanedCount = 0;

    // Clean up old session data
    for (const key of sessionKeys) {
      try {
        const ttl = await client.ttl(key);
        if (ttl === -1) {
          // Key has no expiration set, remove it if it's old
          await client.del(key);
          cleanedCount++;
        }
      } catch (error) {
        console.error(`Error processing session ${key}:`, error);
      }
    }

    // Clean up old user status data
    for (const key of userStatusKeys) {
      try {
        const ttl = await client.ttl(key);
        if (ttl === -1) {
          // Key has no expiration set, remove it if it's old
          await client.del(key);
          cleanedCount++;
        }
      } catch (error) {
        console.error(`Error processing user status ${key}:`, error);
      }
    }

    console.log(`Session cleanup completed. Removed ${cleanedCount} inactive sessions.`);
    return cleanedCount;
  } catch (error) {
    console.error('Error during session cleanup:', error);
    return 0;
  }
};

// Get Redis storage stats
export const getRedisStats = async () => {
  try {
    const client = getRedisClient();
    if (!client) {
      return null;
    }

    const accessTokens = await client.keys('access_token:*');
    const refreshTokens = await client.keys('refresh_token:*');
    const sessions = await client.keys('session:*');
    const userStatus = await client.keys('user_status:*');

    return {
      accessTokenCount: accessTokens.length,
      refreshTokenCount: refreshTokens.length,
      sessionCount: sessions.length,
      userStatusCount: userStatus.length,
      totalKeys: accessTokens.length + refreshTokens.length + sessions.length + userStatus.length
    };
  } catch (error) {
    console.error('Error getting Redis stats:', error);
    return null;
  }
};