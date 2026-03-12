import { Worker } from 'bullmq';
import redisConnection from '../config/redis.js';
import env from '../config/env.js';
import { searchGoogleMaps } from '../services/serpApiService.js';
import { upsertBusiness } from '../services/deduplicationService.js';
import { addCrawlJob } from '../queues/queueSetup.js';
import logger from '../utils/logger.js';

const mapsWorker = new Worker(
  'maps-search',
  async (job) => {
    const { keyword, coords, city } = job.data;
    logger.info(`[MapsWorker] Processing: "${keyword}" at ${coords} (${city})`);

    try {
      const results = await searchGoogleMaps(keyword, coords);
      let newCount = 0;
      let dupeCount = 0;

      for (const biz of results) {
        const businessData = {
          name: biz.title,
          address: biz.address,
          phone: biz.phone,
          website: biz.website,
          rating: biz.rating,
          reviews: biz.reviews,
          place_id: biz.place_id,
          city,
          keyword,
        };

        const { doc, isNew } = await upsertBusiness(businessData);

        if (isNew) {
          newCount++;
          // Push website to crawl queue if website exists and not yet crawled
          if (doc.website && !doc.crawled) {
            await addCrawlJob(doc._id.toString(), doc.website);
          }
        } else {
          dupeCount++;
          // Still queue for crawl if not yet crawled and has website
          if (doc.website && !doc.crawled) {
            await addCrawlJob(doc._id.toString(), doc.website);
          }
        }
      }

      logger.info(
        `[MapsWorker] Done: "${keyword}" at ${coords} — ${newCount} new, ${dupeCount} duplicates`
      );

      return { newCount, dupeCount, total: results.length };
    } catch (error) {
      logger.error(`[MapsWorker] Error for "${keyword}" at ${coords}: ${error.message}`);
      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: env.mapsWorkerConcurrency,
    limiter: {
      max: 10,
      duration: 1000,
    },
  }
);

mapsWorker.on('completed', (job, result) => {
  logger.debug(`[MapsWorker] Job ${job.id} completed: ${JSON.stringify(result)}`);
});

mapsWorker.on('failed', (job, error) => {
  logger.error(`[MapsWorker] Job ${job?.id} failed: ${error.message}`);
});

mapsWorker.on('error', (error) => {
  logger.error(`[MapsWorker] Worker error: ${error.message}`);
});

export default mapsWorker;
