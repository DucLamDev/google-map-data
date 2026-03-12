import express from 'express';
import connectDB from './config/db.js';
import env from './config/env.js';
import apiRoutes from './routes/api.js';
import logger from './utils/logger.js';

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  logger.debug(`${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api', apiRoutes);

// Root
app.get('/', (req, res) => {
  res.json({
    name: 'Google Maps Lead Scraper API',
    version: '1.0.0',
    endpoints: {
      health: 'GET /api/health',
      stats: 'GET /api/stats',
      scrape: 'POST /api/scrape',
      leads: 'GET /api/leads',
      exportCSV: 'POST /api/export',
      downloadCSV: 'GET /api/export/download',
      deduplicate: 'POST /api/deduplicate',
      cities: 'GET /api/cities',
      addCity: 'POST /api/cities',
      cityGrid: 'GET /api/cities/:name/grid',
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, _next) => {
  logger.error(`Unhandled error: ${err.message}`);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const start = async () => {
  await connectDB();
  app.listen(env.port, () => {
    logger.info(`Server running on port ${env.port} (${env.nodeEnv})`);
  });
};

start().catch((error) => {
  logger.error(`Server startup failed: ${error.message}`);
  process.exit(1);
});

export default app;
