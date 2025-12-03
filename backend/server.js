const express = require('express');
const cors = require('cors');
require('dotenv').config();

// 导入Redis客户端以确保连接
const redisClient = require('./utils/redisClient');

// 导入路由
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const problemRoutes = require('./routes/problems');

// 初始化Express应用
const app = express();

// 中间件
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173', 'http://127.0.0.1:3000'], // 允许的前端地址
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // 允许的HTTP方法
  allowedHeaders: ['Content-Type', 'Authorization'], // 允许的请求头
  credentials: true // 允许发送凭证
}));
app.use(express.json());

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/problems', problemRoutes);

// 默认路由
app.get('/', (req, res) => {
  res.json({ message: '欢迎使用教育网站后端API' });
});

// 启动服务器 - 等待Redis连接成功后再启动
const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    // 确保Redis客户端已连接
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
    console.log('Redis连接成功');
    
    // 启动HTTP服务器
    app.listen(PORT, () => {
      console.log(`服务器运行在端口 ${PORT}`);
    });
  } catch (error) {
    console.error('启动服务器失败:', error);
    process.exit(1);
  }
}

// 调用启动函数
startServer();
