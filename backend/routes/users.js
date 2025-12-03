const express = require('express');
const db = require('../config/database');
const router = express.Router();

// 获取所有用户
router.get('/', async (req, res) => {
  try {
    const [users] = await db.execute(
      'SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取用户信息
router.get('/:id', async (req, res) => {
  try {
    const userId = req.params.id;

    const [users] = await db.execute(
      'SELECT id, username, email, role, created_at FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: '用户不存在' });
    }

    res.json(users[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取用户的课程列表
router.get('/:id/courses', async (req, res) => {
  try {
    const userId = req.params.id;

    const [courses] = await db.execute(`
      SELECT c.*, uc.progress, uc.started_at, uc.completed_at
      FROM courses c
      JOIN user_courses uc ON c.id = uc.course_id
      WHERE uc.user_id = ?
      ORDER BY uc.started_at DESC
    `, [userId]);

    res.json(courses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取用户在特定课程中的学习进度
router.get('/:id/courses/:courseId/progress', async (req, res) => {
  try {
    const userId = req.params.id;
    const courseId = req.params.courseId;

    // 获取课程内容列表及用户完成状态
    const [contents] = await db.execute(`
      SELECT cc.*, 
        CASE WHEN ucp.completed = 1 THEN TRUE ELSE FALSE END as completed,
        ucp.completed_at
      FROM course_contents cc
      LEFT JOIN user_content_progress ucp ON cc.id = ucp.content_id AND ucp.user_id = ?
      WHERE cc.course_id = ?
      ORDER BY cc.order_index
    `, [userId, courseId]);

    // 获取课程总体进度
    const [courseProgress] = await db.execute(
      'SELECT progress, started_at, completed_at FROM user_courses WHERE user_id = ? AND course_id = ?',
      [userId, courseId]
    );

    res.json({
      contents,
      progress: courseProgress.length > 0 ? courseProgress[0] : { progress: 0 }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 更新用户信息
router.patch('/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const { password } = req.body;
    
    // 如果需要更新密码
    if (password) {
      // 直接使用明文密码存储（仅用于开发阶段）

      await db.execute(
        'UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?',
        [password, userId]
      );
    }
    
    // 获取更新后的用户信息
    const [users] = await db.execute(
      'SELECT id, username, email, role, created_at FROM users WHERE id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ message: '用户不存在' });
    }
    
    res.json(users[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;