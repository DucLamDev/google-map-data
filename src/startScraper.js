import connectDB from './config/db.js';
import { generateAllGrids } from './modules/gridGenerator.js';
import { addMapsSearchJob } from './queues/queueSetup.js';
import logger from './utils/logger.js';

const CITIES = ['Ho Chi Minh', 'Ha Noi', 'Nha Trang', 'Da Lat'];

const KEYWORDS = [
  'travel agency',
  'hotel',
  'restaurant',
  'coffee shop',
  'spa',
  'gym',
  'dental clinic',
  'real estate agency',
  'car rental',
  'beauty salon',
];

const startScraper = async () => {
  await connectDB();
  logger.info('=== Starting Lead Scraper ===');

  // 1. Generate grid coordinates for all cities
  const gridPoints = generateAllGrids(CITIES);
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
