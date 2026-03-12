import connectDB from './config/db.js';
import { exportToCSV, exportEmailLeads, exportHighScoreLeads } from './export.js';
import logger from './utils/logger.js';

const main = async () => {
  await connectDB();

  const arg = process.argv[2] || 'all';

  let filePath;
  switch (arg) {
    case 'email':
      filePath = await exportEmailLeads();
      break;
    case 'highscore':
      filePath = await exportHighScoreLeads(parseInt(process.argv[3], 10) || 50);
      break;
    default:
      filePath = await exportToCSV();
  }

  logger.info(`Export complete: ${filePath}`);
  process.exit(0);
};

main().catch((error) => {
  logger.error(`Export failed: ${error.message}`);
  process.exit(1);
});
