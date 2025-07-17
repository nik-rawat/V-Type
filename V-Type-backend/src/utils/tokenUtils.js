import jwt from 'jsonwebtoken';
import { getRedisClient } from '../config/redis.js';

export const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId, type: 'access' },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m' }
  );

  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d' }
  );

  return { accessToken, refreshToken };
};

export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  } catch (error) {
    throw new Error('Invalid access token');
  }
};

export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
};

export const storeRefreshToken = async (userId, refreshToken) => {
  try {
    const client = getRedisClient();
    const key = `refresh_token:${userId}`;
    
    // Store refresh token with expiration (7 days)
    await client.setEx(key, 7 * 24 * 60 * 60, refreshToken);
  } catch (error) {
    console.error('Error storing refresh token:', error);
    throw new Error('Failed to store refresh token');
  }
};

export const getStoredRefreshToken = async (userId) => {
  try {
    const client = getRedisClient();
    const key = `refresh_token:${userId}`;
    return await client.get(key);
  } catch (error) {
    console.error('Error getting refresh token:', error);
    return null;
  }
};

export const removeRefreshToken = async (userId) => {
  try {
    const client = getRedisClient();
    const key = `refresh_token:${userId}`;
    await client.del(key);
  } catch (error) {
    console.error('Error removing refresh token:', error);
  }
};

export const blacklistAccessToken = async (token) => {
  try {
    const client = getRedisClient();
    const decoded = jwt.decode(token);
    const key = `blacklist:${token}`;
    
    // Calculate remaining time until token expires
    const now = Math.floor(Date.now() / 1000);
    const remainingTime = decoded.exp - now;
    
    if (remainingTime > 0) {
      await client.setEx(key, remainingTime, 'blacklisted');
    }
  } catch (error) {
    console.error('Error blacklisting token:', error);
  }
};

export const isTokenBlacklisted = async (token) => {
  try {
    const client = getRedisClient();
    const key = `blacklist:${token}`;
    const result = await client.get(key);
    return result !== null;
  } catch (error) {
    console.error('Error checking blacklist:', error);
    return false;
  }
};