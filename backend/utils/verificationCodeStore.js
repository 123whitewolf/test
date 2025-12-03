const redisClient = require('./redisClient');

class VerificationCodeStore {
  // 存储验证码
  async setCode(email, code, expiresIn = 300) { // 默认5分钟过期
    try {
      // 使用Redis的SETEX命令，设置键值对并指定过期时间（秒）
      await redisClient.setEx(email, expiresIn, code);
    } catch (error) {
      console.error('存储验证码到Redis失败:', error);
      // 如果Redis失败，可以降级到内存存储或其他处理方式
      throw new Error('验证码存储失败');
    }
  }

  // 验证验证码
  async verifyCode(email, code) {
    try {
      // 从Redis获取存储的验证码
      const storedCode = await redisClient.get(email);
      
      // 如果没有找到验证码或验证码不匹配
      if (!storedCode || storedCode !== code) {
        return false;
      }
      
      // 验证成功后删除记录
      await redisClient.del(email);
      return true;
    } catch (error) {
      console.error('验证验证码时Redis操作失败:', error);
      // 如果Redis失败，返回验证失败
      return false;
    }
  }
}

module.exports = new VerificationCodeStore();


/*
# 为什么生产环境不能使用内存存储而要使用Redis

当前`verificationCodeStore.js`使用的是简单的内存存储（Map对象），这种方式在开发阶段可以工作，但在生产环境中存在几个严重问题：

## 内存存储的问题

1. **数据持久性差**
   - 内存中的数据在服务器重启后会全部丢失
   - 如果应用崩溃或需要重新部署，所有未使用的验证码都会失效

2. **单点限制**
   - 内存存储仅限于单个服务器实例
   - 如果使用负载均衡部署多个服务器实例，每个实例都有自己独立的验证码存储
   - 用户在A服务器请求验证码，但请求可能被路由到B服务器进行验证，导致验证失败

3. **可扩展性问题**
   - 随着用户量增长，内存中存储的验证码会越来越多
   - 没有有效的过期清理机制（虽然有代码检查，但不保证及时清理）
   - 可能导致内存泄漏，最终耗尽服务器内存

4. **安全性问题**
   - 验证码存储在应用内存中，更容易受到内存攻击
   - 没有额外的安全层保护

## Redis的优势

1. **数据持久化**
   - Redis可以将数据持久化到磁盘，即使服务器重启数据也不会丢失
   - 支持多种持久化策略（RDB快照和AOF日志）

2. **分布式支持**
   - Redis可以作为中央存储服务，被多个应用实例共享
   - 解决了多服务器部署时的数据一致性问题

3. **高效过期机制**
   - Redis内置了高效的键过期机制，自动清理过期数据
   - 不需要应用代码手动检查和清理

4. **高性能**
   - Redis是内存数据库，读写速度极快
   - 使用单线程模型避免了锁竞争

5. **丰富的数据结构**
   - 支持多种数据类型，适合不同场景
   - 对于验证码这种场景，可以使用简单的字符串键值对

6. **可扩展性**
   - 支持主从复制和分片，可以轻松扩展
   - 适合大规模生产环境

## 代码示例

使用Redis的验证码存储可能如下所示：

```javascript
const redis = require('redis');
const client = redis.createClient();

class VerificationCodeStore {
  // 存储验证码
  async setCode(email, code, expiresIn = 300) {
    await client.setex(email, expiresIn, code);
  }

  // 验证验证码
  async verifyCode(email, code) {
    const storedCode = await client.get(email);
    
    if (!storedCode || storedCode !== code) {
      return false;
    }
    
    // 验证成功后删除记录
    await client.del(email);
    return true;
  }
}
```

## 结论

虽然内存存储在开发和测试阶段很方便，但在生产环境中使用Redis等专业解决方案是更可靠、更安全、更可扩展的选择。特别是在需要处理大量用户或部署多个服务器实例的情况下，Redis几乎是必不可少的。


*/


/*
# 为什么生产环境不能使用内存存储而要使用Redis

当前`verificationCodeStore.js`使用的是简单的内存存储（Map对象），这种方式在开发阶段可以工作，但在生产环境中存在几个严重问题：

## 内存存储的问题

1. **数据持久性差**
   - 内存中的数据在服务器重启后会全部丢失
   - 如果应用崩溃或需要重新部署，所有未使用的验证码都会失效

2. **单点限制**
   - 内存存储仅限于单个服务器实例
   - 如果使用负载均衡部署多个服务器实例，每个实例都有自己独立的验证码存储
   - 用户在A服务器请求验证码，但请求可能被路由到B服务器进行验证，导致验证失败

3. **可扩展性问题**
   - 随着用户量增长，内存中存储的验证码会越来越多
   - 没有有效的过期清理机制（虽然有代码检查，但不保证及时清理）
   - 可能导致内存泄漏，最终耗尽服务器内存

4. **安全性问题**
   - 验证码存储在应用内存中，更容易受到内存攻击
   - 没有额外的安全层保护

## Redis的优势

1. **数据持久化**
   - Redis可以将数据持久化到磁盘，即使服务器重启数据也不会丢失
   - 支持多种持久化策略（RDB快照和AOF日志）

2. **分布式支持**
   - Redis可以作为中央存储服务，被多个应用实例共享
   - 解决了多服务器部署时的数据一致性问题

3. **高效过期机制**
   - Redis内置了高效的键过期机制，自动清理过期数据
   - 不需要应用代码手动检查和清理

4. **高性能**
   - Redis是内存数据库，读写速度极快
   - 使用单线程模型避免了锁竞争

5. **丰富的数据结构**
   - 支持多种数据类型，适合不同场景
   - 对于验证码这种场景，可以使用简单的字符串键值对

6. **可扩展性**
   - 支持主从复制和分片，可以轻松扩展
   - 适合大规模生产环境

## 代码示例

使用Redis的验证码存储可能如下所示：

```javascript
const redis = require('redis');
const client = redis.createClient();

class VerificationCodeStore {
  // 存储验证码
  async setCode(email, code, expiresIn = 300) {
    await client.setex(email, expiresIn, code);
  }

  // 验证验证码
  async verifyCode(email, code) {
    const storedCode = await client.get(email);
    
    if (!storedCode || storedCode !== code) {
      return false;
    }
    
    // 验证成功后删除记录
    await client.del(email);
    return true;
  }
}
```

## 结论

虽然内存存储在开发和测试阶段很方便，但在生产环境中使用Redis等专业解决方案是更可靠、更安全、更可扩展的选择。特别是在需要处理大量用户或部署多个服务器实例的情况下，Redis几乎是必不可少的。


*/ 