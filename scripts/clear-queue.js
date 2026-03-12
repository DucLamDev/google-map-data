import { Queue } from 'bullmq';
import redisConnection from '../src/config/redis.js';
import logger from '../src/utils/logger.js';

const clearQueues = async () => {
  const mapsQueue = new Queue('maps-search', { connection: redisConnection });
  const crawlQueue = new Queue('website-crawl', { connection: redisConnection });

  console.log('Clearing queues...\n');

  const [mapsObliterated, crawlObliterated] = await Promise.all([
    mapsQueue.obliterate({ force: true }),
    crawlQueue.obliterate({ force: true })
  ]);

  console.log(`Maps search queue: cleared`);
  console.log(`Website crawl queue: cleared\n`);

  await mapsQueue.close();
  await crawlQueue.close();

  console.log('Done!');
  process.exit(0);
};

clearQueues().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
