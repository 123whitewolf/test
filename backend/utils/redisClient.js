const redis = require('redis');
require('dotenv').config();

// 构建 Redis 连接 URL，优先使用 REDIS_URL，其次使用 HOST/PORT
const redisUrl = process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || '127.0.0.1'}:${process.env.REDIS_PORT || 6379}`;

const client = redis.createClient({ url: redisUrl });

client.on('error', (err) => {
  console.error('Redis 客户端错误:', err);
  // 尝试重连
  if (!client.isOpen) {
    client.connect().catch(console.error);
  }
});

// 不在这里立即连接，让server.js来控制连接时机
// (async () => {
//   try {
//     await client.connect();
//     console.log('Connected to Redis');
//   } catch (err) {
//     // 不要让 Redis 连接失败阻塞整个程序启动，记录错误并继续
//     console.error('Failed to connect to Redis:', err && err.message ? err.message : err);
//   }
// })();

module.exports = client;
