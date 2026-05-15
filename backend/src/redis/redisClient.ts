import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const getRedisConfig = () => {
  if (REDIS_URL.startsWith('rediss://')) {
    return {
      tls: {
        rejectUnauthorized: false
      }
    };
  }
  return {};
};

export const pubClient = new Redis(REDIS_URL, getRedisConfig());
export const subClient = new Redis(REDIS_URL, getRedisConfig());
export const stateClient = new Redis(REDIS_URL, getRedisConfig());

pubClient.on('error', (err) => console.error('Redis pubClient Error:', err));
subClient.on('error', (err) => console.error('Redis subClient Error:', err));
stateClient.on('error', (err) => console.error('Redis stateClient Error:', err));

pubClient.on('connect', () => console.log('Redis connected successfully'));
