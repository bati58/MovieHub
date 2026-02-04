let redisClient = null;
let redisReady = false;

async function initRedis() {
    if (!process.env.REDIS_URL) return;
    let createClient;
    try {
        ({ createClient } = require('redis'));
    } catch (err) {
        console.warn('[Redis] module not installed, falling back to memory cache.');
        return;
    }
    redisClient = createClient({ url: process.env.REDIS_URL });
    redisClient.on('error', (err) => {
        console.error('[Redis] error:', err.message);
        redisReady = false;
    });
    await redisClient.connect();
    redisReady = true;
    console.log('[Redis] connected');
}

const memoryCache = new Map();

async function getCache(key) {
    if (redisClient && redisReady) {
        const value = await redisClient.get(key);
        return value ? JSON.parse(value) : null;
    }
    const entry = memoryCache.get(key);
    if (!entry) return null;
    if (entry.expires < Date.now()) {
        memoryCache.delete(key);
        return null;
    }
    return entry.data;
}

async function setCache(key, data, ttlMs) {
    if (redisClient && redisReady) {
        const seconds = Math.max(1, Math.floor(ttlMs / 1000));
        await redisClient.set(key, JSON.stringify(data), { EX: seconds });
        return;
    }
    memoryCache.set(key, { data, expires: Date.now() + ttlMs });
}

module.exports = {
    initRedis,
    getCache,
    setCache
};
