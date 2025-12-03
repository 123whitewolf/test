const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const db = require('../config/database');
const { checkEmailExists, checkUsernameExists } = require('../utils/helpers');
const verificationCodeStore = require('../utils/verificationCodeStore');
const router = express.Router();

// 创建QQ邮箱邮件传输器
const createQQEmailTransporter = () => {
  return nodemailer.createTransport({
    service: 'qq',
    auth: {
      user: process.env.QQ_EMAIL, // 您的QQ邮箱
      pass: process.env.QQ_EMAIL_AUTH_CODE // QQ邮箱授权码，不是QQ密码
    }
  });
};

// 生成随机验证码
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// 发送邮箱验证码
router.post('/send-email-verification', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: '请输入邮箱地址' });
    }

    // 验证是否为QQ邮箱
    if (!email.endsWith('@qq.com') && !email.endsWith('@vip.qq.com')) {
      return res.status(400).json({ message: '只支持QQ邮箱注册' });
    }

    // 检查邮箱是否已存在
    const emailExists = await checkEmailExists(email);
    if (emailExists) {
      return res.status(400).json({ message: '该邮箱已被注册' });
    }

    // 生成验证码
    const code = generateVerificationCode();
    
    // 存储验证码
    await verificationCodeStore.setCode(email, code);
    
    // 创建邮件传输器
    const transporter = createQQEmailTransporter();
    
    // 设置邮件内容
    const mailOptions = {
      from: process.env.QQ_EMAIL,
      to: email,
      subject: '西安理工在线刷题平台 - 邮箱验证',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
          <h2 style="color: #333; text-align: center;">西安理工在线刷题平台</h2>
          <h3 style="color: #555;">邮箱验证</h3>
          <p>您好！</p>
          <p>您正在注册西安理工在线刷题平台账号，您的验证码是：</p>
          <div style="background-color: #f5f5f5; padding: 15px; text-align: center; margin: 20px 0; border-radius: 5px;">
            <span style="font-size: 24px; font-weight: bold; color: #1890ff;">${code}</span>
          </div>
          <p>验证码有效期为5分钟，请尽快完成验证。</p>
          <p>如果这不是您本人的操作，请忽略此邮件。</p>
          <p style="margin-top: 30px; color: #999; font-size: 12px;">此邮件由系统自动发送，请勿回复。</p>
        </div>
      `
    };
    
    // 发送邮件
    await transporter.sendMail(mailOptions);
    
    res.json({ success: true, message: '验证码已发送到您的邮箱' });
  } catch (error) {
    console.error('发送邮件失败:', error);
    res.status(500).json({ message: '发送验证码失败，请稍后重试' });
  }
});

// 验证邮箱和验证码
router.post('/verify-email', async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ message: '邮箱和验证码不能为空' });
    }

    const isValid = await verificationCodeStore.verifyCode(email, code);
    
    if (isValid) {
      res.json({ success: true, message: '验证成功' });
    } else {
      res.status(400).json({ message: '验证码错误或已过期' });
    }
  } catch (error) {
    console.error('验证失败:', error);
    res.status(500).json({ message: '验证失败，请稍后重试' });
  }
});

// 用户注册
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, role = 'student' } = req.body;

    // 检查用户名和邮箱是否已存在
    const emailExists = await checkEmailExists(email);
    const usernameExists = await checkUsernameExists(username);

    if (emailExists || usernameExists) {
      return res.status(400).json({ message: '用户名或邮箱已存在' });
    }

    // 创建新用户（使用明文密码）
    const [result] = await db.execute(
      'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
      [username, email, password, role]
    );

    // 返回与前端db.json格式一致的用户对象
    res.status(201).json({ 
      id: result.insertId.toString(),
      username,
      email,
      role
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 用户登录
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body; 

    // 查找用户
    const [users] = await db.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: '用户不存在' });
    }

    const user = users[0];

    // 验证密码（简单数值比较）
    if (password !== user.password) {
      return res.status(401).json({ message: '邮箱或密码错误' });
    }

    // 生成JWT令牌
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );
    res.json({
      id: user.id.toString(),
      email: user.email,
      username: user.username,
      studentId: user.id.toString(), // 添加studentId字段，使用id的值
      role: user.role,  //- 这个字段用于区分用户角色, 如 'student' 或 'admin'  后期在前端会有具体的判断和使用逻辑
      token 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 发送密码重置验证码
router.post('/send-password-reset-code', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: '请输入邮箱地址' });
    }

    // 验证是否为QQ邮箱
    if (!email.endsWith('@qq.com') && !email.endsWith('@vip.qq.com')) {
      return res.status(400).json({ message: '只支持QQ邮箱' });
    }

    // 检查邮箱是否存在（与注册流程相反）
    const emailExists = await checkEmailExists(email);
    if (!emailExists) {
      return res.status(400).json({ message: '该邮箱尚未注册' });
    }

    // 生成验证码
    const code = generateVerificationCode();

    // 存储验证码
    await verificationCodeStore.setCode(email, code);

    // 创建邮件传输器
    const transporter = createQQEmailTransporter();

    // 设置邮件内容
    const mailOptions = {
      from: process.env.QQ_EMAIL,
      to: email,
      subject: '西安理工在线刷题平台 - 密码重置',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #3f51b5; margin: 0;">西安理工在线刷题平台</h1>
            <p style="color: #666; margin: 5px 0 0 0;">密码重置验证码</p>
          </div>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <p style="margin: 0 0 10px 0; font-size: 16px;">您好，</p>
            <p style="margin: 0 0 15px 0; font-size: 16px;">您正在尝试重置密码，您的验证码是：</p>
            <div style="background-color: #3f51b5; color: white; font-size: 24px; font-weight: bold; padding: 15px; text-align: center; border-radius: 4px; letter-spacing: 3px;">
              ${code}
            </div>
            <p style="margin: 15px 0 0 0; font-size: 14px; color: #666;">验证码有效期为10分钟，请尽快使用。</p>
          </div>
          
          <div style="text-align: center; font-size: 12px; color: #888;">
            <p>如果您没有请求重置密码，请忽略此邮件。</p>
            <p>© ${new Date().getFullYear()} 西安理工在线刷题平台，保留所有权利。</p>
          </div>
        </div>
      `
    };

    // 发送邮件
    await transporter.sendMail(mailOptions);

    res.json({ message: '验证码已发送到您的邮箱' });
  } catch (error) {
    console.error('发送密码重置验证码错误:', error);
    res.status(500).json({ message: '发送验证码失败，请稍后重试' });
  }
});

module.exports = router;
