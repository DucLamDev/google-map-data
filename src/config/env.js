import dotenv from 'dotenv';
dotenv.config();

const normalizeEnvValue = (value, fallback = '') => {
  if (typeof value !== 'string') {
    return fallback;
  }

  const normalized = value.trim();
  if (!normalized || normalized === 'undefined' || normalized === 'null') {
    return fallback;
  }

  return normalized;
};

const env = {
  serpApiKey: normalizeEnvValue(process.env.SERPAPI_KEY, ''),
  mongoUri: normalizeEnvValue(process.env.MONGODB_URI, 'mongodb://localhost:27017/leads_scraper'),
  redisHost: normalizeEnvValue(process.env.REDIS_HOST, '127.0.0.1'),
  redisPort: parseInt(process.env.REDIS_PORT, 10) || 6379,
  redisPassword: normalizeEnvValue(process.env.REDIS_PASSWORD, undefined),
  redisUsername: normalizeEnvValue(process.env.REDIS_USERNAME, undefined),
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: normalizeEnvValue(process.env.NODE_ENV, 'development'),
  mapsWorkerConcurrency: parseInt(process.env.MAPS_WORKER_CONCURRENCY, 10) || 10,
  crawlWorkerConcurrency: parseInt(process.env.CRAWL_WORKER_CONCURRENCY, 10) || 10,
  requestTimeout: parseInt(process.env.REQUEST_TIMEOUT, 10) || 15000,
  maxRetries: parseInt(process.env.MAX_RETRIES, 10) || 3,
  crawlDelayMs: parseInt(process.env.CRAWL_DELAY_MS, 10) || 1000,
};

export default env;
