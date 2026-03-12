import env from './env.js';

const redisConnection = {
  host: env.redisHost,
  port: env.redisPort,
  ...(env.redisPassword && { password: env.redisPassword }),
  maxRetriesPerRequest: null,
};

export default redisConnection;
