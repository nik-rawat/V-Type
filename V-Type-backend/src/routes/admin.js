import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { 
  triggerManualCleanup 
} from '../services/scheduler.js';
import { 
  cleanupExpiredAccessTokens, 
  cleanupExpiredRefreshTokens, 
  getRedisStats 
} from '../utils/tokenCleanup.js';
import User from '../models/user.js';

const router = express.Router();

// Middleware to check if user is admin
const requireAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user || !user.roles.includes('admin')) {
      return res.status(403).json({ message: 'Admin access required' });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get Redis storage statistics
router.get('/redis/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const stats = await getRedisStats();
    res.json({
      message: 'Redis storage statistics',
      stats: stats
    });
  } catch (error) {
    console.error('Redis stats error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Manual cleanup of all expired tokens
router.post('/cleanup/all', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await triggerManualCleanup();
    res.json({
      message: 'Manual cleanup completed',
      result: result
    });
  } catch (error) {
    console.error('Manual cleanup error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Manual cleanup of access tokens only
router.post('/cleanup/access-tokens', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const cleaned = await cleanupExpiredAccessTokens();
    res.json({
      message: 'Access token cleanup completed',
      cleanedCount: cleaned
    });
  } catch (error) {
    console.error('Access token cleanup error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Manual cleanup of refresh tokens only
router.post('/cleanup/refresh-tokens', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const cleaned = await cleanupExpiredRefreshTokens();
    res.json({
      message: 'Refresh token cleanup completed',
      cleanedCount: cleaned
    });
  } catch (error) {
    console.error('Refresh token cleanup error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;