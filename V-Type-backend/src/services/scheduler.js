import cron from 'node-cron';
import { 
  cleanupExpiredAccessTokens, 
  cleanupExpiredRefreshTokens, 
  cleanupInactiveSessions,
  getRedisStats 
} from '../utils/tokenCleanup.js';

let cleanupJobs = [];

// Initialize cleanup schedulers
export const initializeCleanupSchedulers = () => {
  console.log('Initializing token cleanup schedulers...');

  // Cleanup expired access tokens every hour
  const accessTokenCleanup = cron.schedule('0 * * * *', async () => {
    console.log('Running scheduled access token cleanup...');
    const stats = await getRedisStats();
    if (stats) {
      console.log('Before cleanup:', stats);
    }
    
    const cleaned = await cleanupExpiredAccessTokens();
    
    const newStats = await getRedisStats();
    if (newStats) {
      console.log('After cleanup:', newStats);
    }
  }, {
    scheduled: false,
    timezone: "UTC"
  });

  // Cleanup expired refresh tokens every 24 hours
  const refreshTokenCleanup = cron.schedule('0 0 * * *', async () => {
    console.log('Running scheduled refresh token cleanup...');
    const stats = await getRedisStats();
    if (stats) {
      console.log('Before cleanup:', stats);
    }
    
    const cleaned = await cleanupExpiredRefreshTokens();
    
    const newStats = await getRedisStats();
    if (newStats) {
      console.log('After cleanup:', newStats);
    }
  }, {
    scheduled: false,
    timezone: "UTC"
  });

  // Cleanup inactive sessions every 6 hours
  const sessionCleanup = cron.schedule('0 */6 * * *', async () => {
    console.log('Running scheduled session cleanup...');
    await cleanupInactiveSessions();
  }, {
    scheduled: false,
    timezone: "UTC"
  });

  // Store job references
  cleanupJobs = [accessTokenCleanup, refreshTokenCleanup, sessionCleanup];

  // Start all jobs
  accessTokenCleanup.start();
  refreshTokenCleanup.start();
  sessionCleanup.start();

  console.log('Token cleanup schedulers initialized:');
  console.log('- Access tokens: Every hour');
  console.log('- Refresh tokens: Every 24 hours');
  console.log('- Sessions: Every 6 hours');
};

// Stop all cleanup schedulers
export const stopCleanupSchedulers = () => {
  console.log('Stopping cleanup schedulers...');
  cleanupJobs.forEach(job => {
    if (job) {
      job.stop();
    }
  });
  cleanupJobs = [];
};

// Manual cleanup trigger
export const triggerManualCleanup = async () => {
  console.log('Starting manual cleanup...');
  
  const stats = await getRedisStats();
  console.log('Before manual cleanup:', stats);
  
  const [accessCleaned, refreshCleaned, sessionCleaned] = await Promise.all([
    cleanupExpiredAccessTokens(),
    cleanupExpiredRefreshTokens(),
    cleanupInactiveSessions()
  ]);
  
  const newStats = await getRedisStats();
  console.log('After manual cleanup:', newStats);
  
  return {
    accessTokensCleaned: accessCleaned,
    refreshTokensCleaned: refreshCleaned,
    sessionsCleaned: sessionCleaned,
    beforeStats: stats,
    afterStats: newStats
  };
};