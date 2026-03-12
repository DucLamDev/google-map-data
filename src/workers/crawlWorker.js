import { Worker } from 'bullmq';
import redisConnection from '../config/redis.js';
import env from '../config/env.js';
import { crawlWebsite } from '../services/crawlerService.js';
import { cleanEmails, validateEmail, scoreLead } from '../services/emailService.js';
import Business from '../models/Business.js';
import logger from '../utils/logger.js';

const crawlWorker = new Worker(
  'website-crawl',
  async (job) => {
    const { businessId, website } = job.data;
    logger.info(`[CrawlWorker] Crawling: ${website} (business: ${businessId})`);

    try {
      // Fetch and extract emails
      const rawEmails = await crawlWebsite(website);
      const cleanedEmails = cleanEmails(rawEmails);

      // Pick the best email (first valid one)
      const bestEmail = cleanedEmails.length > 0 ? cleanedEmails[0] : '';

      // Update business record
      const business = await Business.findById(businessId);
      if (!business) {
        logger.warn(`[CrawlWorker] Business not found: ${businessId}`);
        return { status: 'not_found' };
      }

      const updates = {
        crawled: true,
      };

      if (bestEmail) {
        updates.email = bestEmail;
        updates.emailValid = validateEmail(bestEmail);
      }

      // Calculate lead score
      const leadData = {
        email: bestEmail || business.email,
        website: business.website,
        phone: business.phone,
        rating: business.rating,
        reviews: business.reviews,
      };
      updates.leadScore = scoreLead(leadData);

      await Business.updateOne({ _id: businessId }, { $set: updates });

      logger.info(
        `[CrawlWorker] Done: ${website} — emails found: ${cleanedEmails.length}, best: ${bestEmail || 'none'}, score: ${updates.leadScore}`
      );

      return {
        emailsFound: cleanedEmails.length,
        bestEmail,
        leadScore: updates.leadScore,
      };
    } catch (error) {
      logger.error(`[CrawlWorker] Error for ${website}: ${error.message}`);
      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: env.crawlWorkerConcurrency,
    limiter: {
      max: 5,
      duration: 1000,
    },
  }
);

crawlWorker.on('completed', (job, result) => {
  logger.debug(`[CrawlWorker] Job ${job.id} completed: ${JSON.stringify(result)}`);
});

crawlWorker.on('failed', (job, error) => {
  logger.error(`[CrawlWorker] Job ${job?.id} failed: ${error.message}`);
});

crawlWorker.on('error', (error) => {
  logger.error(`[CrawlWorker] Worker error: ${error.message}`);
});

export default crawlWorker;
