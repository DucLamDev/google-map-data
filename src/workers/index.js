import connectDB from '../config/db.js';
import logger from '../utils/logger.js';
import mapsWorker from './mapsWorker.js';
import crawlWorker from './crawlWorker.js';

const startWorkers = async () => {
  await connectDB();
  logger.info('All workers started');
  logger.info(`Maps worker concurrency: ${mapsWorker.opts.concurrency}`);
  logger.info(`Crawl worker concurrency: ${crawlWorker.opts.concurrency}`);
};

startWorkers().catch((error) => {
  logger.error(`Failed to start workers: ${error.message}`);
  process.exit(1);
});

// Graceful shutdown
const shutdown = async () => {
  logger.info('Shutting down workers...');
  await mapsWorker.close();
  await crawlWorker.close();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
