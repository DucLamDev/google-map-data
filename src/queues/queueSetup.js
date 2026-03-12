import { Queue } from 'bullmq';
import redisConnection from '../config/redis.js';
import logger from '../utils/logger.js';

const defaultJobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000,
  },
  removeOnComplete: { count: 1000 },
  removeOnFail: { count: 5000 },
};

export const mapsSearchQueue = new Queue('maps-search', {
  connection: redisConnection,
  defaultJobOptions,
});

export const websiteCrawlQueue = new Queue('website-crawl', {
  connection: redisConnection,
  defaultJobOptions,
});

/**
 * Add a maps search job to the queue.
 * @param {string} keyword
 * @param {string} coords
 * @param {string} city
 */
export const addMapsSearchJob = async (keyword, coords, city) => {
  const jobId = `maps-${keyword}-${coords}`.replace(/[^a-zA-Z0-9.-]/g, '_');
  await mapsSearchQueue.add(
    'search',
    { keyword, coords, city },
    { jobId }
  );
  logger.debug(`Queued maps search: "${keyword}" at ${coords} (${city})`);
};

/**
 * Add a website crawl job to the queue.
 * @param {string} businessId - MongoDB document ID
 * @param {string} website - URL to crawl
 */
export const addCrawlJob = async (businessId, website) => {
  const jobId = `crawl-${businessId}`;
  await websiteCrawlQueue.add(
    'crawl',
    { businessId, website },
    { jobId }
  );
  logger.debug(`Queued website crawl: ${website}`);
};

/**
 * Get queue stats for monitoring.
 */
export const getQueueStats = async () => {
  const [mapsWaiting, mapsActive, mapsCompleted, mapsFailed] = await Promise.all([
    mapsSearchQueue.getWaitingCount(),
    mapsSearchQueue.getActiveCount(),
    mapsSearchQueue.getCompletedCount(),
    mapsSearchQueue.getFailedCount(),
  ]);

  const [crawlWaiting, crawlActive, crawlCompleted, crawlFailed] = await Promise.all([
    websiteCrawlQueue.getWaitingCount(),
    websiteCrawlQueue.getActiveCount(),
    websiteCrawlQueue.getCompletedCount(),
    websiteCrawlQueue.getFailedCount(),
  ]);

  return {
    mapsSearch: { waiting: mapsWaiting, active: mapsActive, completed: mapsCompleted, failed: mapsFailed },
    websiteCrawl: { waiting: crawlWaiting, active: crawlActive, completed: crawlCompleted, failed: crawlFailed },
  };
};
