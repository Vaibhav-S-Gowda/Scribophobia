import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

export const pubClient = new Redis(REDIS_URL);
export const subClient = pubClient.duplicate();
export const stateClient = pubClient.duplicate();

pubClient.on('error', (err) => console.error('Redis pubClient Error:', err));
subClient.on('error', (err) => console.error('Redis subClient Error:', err));
stateClient.on('error', (err) => console.error('Redis stateClient Error:', err));

pubClient.on('connect', () => console.log('Redis connected successfully'));
