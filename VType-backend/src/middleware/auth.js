import { verifyAccessToken, isTokenBlacklisted } from '../utils/tokenUtils.js';
import User from '../models/user.js';

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        message: 'Access token required',
        code: 'TOKEN_MISSING'
      });
    }

    // Check if token is blacklisted
    const isBlacklisted = await isTokenBlacklisted(token);
    if (isBlacklisted) {
      return res.status(401).json({ 
        message: 'Token has been revoked',
        code: 'TOKEN_REVOKED'
      });
    }

    // Verify token
    const decoded = verifyAccessToken(token);
    
    if (decoded.type !== 'access') {
      return res.status(401).json({ 
        message: 'Invalid token type',
        code: 'INVALID_TOKEN_TYPE'
      });
    }

    // Get user
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({ 
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({ 
        message: 'User account is deactivated',
        code: 'USER_DEACTIVATED'
      });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Access token expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    return res.status(403).json({ 
      message: 'Invalid access token',
      code: 'INVALID_TOKEN'
    });
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return next();
    }

    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (user && user.isActive) {
      req.user = user;
      req.token = token;
    }
    
    next();
  } catch (error) {
    // Continue without authentication if token is invalid
    next();
  }
};