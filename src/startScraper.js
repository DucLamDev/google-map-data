import connectDB from './config/db.js';
import { generateAllGrids } from './modules/gridGenerator.js';
import { addMapsSearchJob } from './queues/queueSetup.js';
import logger from './utils/logger.js';

const CITIES = ['Ho Chi Minh'];

const KEYWORDS = [
  'travel agency',
  'tour operator',
  'hotel',
  'resort',
  'hostel',
  'homestay',
  'car rental',
  'motorbike rental',
  'tour guide',
  'cruise',
  'airline ticket office',
  'visa service',
  'travel insurance',
  'tourist attraction',
  'adventure tour',
];

const startScraper = async () => {
  await connectDB();
  logger.info('=== Starting Lead Scraper ===');

  // 1. Generate grid coordinates for all cities with finer resolution
  // 0.03 degrees ≈ 3km for complete coverage of Ho Chi Minh City
  const gridPoints = generateAllGrids(CITIES, 0.03);
  logger.info(`Total grid points: ${gridPoints.length}`);
  logger.info(`Keywords: ${KEYWORDS.length}`);
  logger.info(`Total jobs to queue: ${gridPoints.length * KEYWORDS.length}`);

  // 2. Loop keywords × grid points and push jobs
  let jobCount = 0;
  for (const keyword of KEYWORDS) {
    for (const { coord, city } of gridPoints) {
      await addMapsSearchJob(keyword, coord, city);
      jobCount++;
    }
  }

  logger.info(`=== Queued ${jobCount} search jobs ===`);
  logger.info('Start workers with: npm run workers');

  // Allow queues to flush before exiting
  setTimeout(() => process.exit(0), 2000);
};

startScraper().catch((error) => {
  logger.error(`Scraper startup failed: ${error.message}`);
  process.exit(1);
});
